import { randomUUID } from "node:crypto";
import {
  connectorOf,
  type ConnectorCredentialsInput,
  type ConnectorErrorReason,
  type ConnectorKey,
  type ConnectorStartInput,
  type DataReadiness,
  familyOf,
} from "@ecommerce/contracts/connectors";
import { prismaClient } from "@ecommerce/database/client";
import type { ConnectionAuthPattern } from "@ecommerce/database/enums";
import { recordActivity } from "@/modules/audit/contract";
import type { AuthContext } from "@/shared/http/auth.types";
import { HttpError, notFound } from "@/shared/http/httpError";
import type { Jobs } from "@/shared/jobs/jobs.types";
import type { Mailer } from "@/shared/mail/mailer.types";
import type { Vault } from "@/shared/crypto/vault";
import type { Authorized, ProviderRegistry } from "./connectorProvider.types";
import { accountExternalId, isPlaceholderId } from "./accountIdentity";
import { connectionsLink } from "./connectionMail";
import {
  connectionOf,
  connectionOnAccount,
  dropIfOrphan,
  saveIntegration,
  upsertAccount,
} from "./connectorAccountsService";
import { needsAccountOf, reconnectSettings } from "./connectionSettings";
import { integrationLabel } from "./integrationLabel";
import { signOAuthState, verifyOAuthState } from "./oauthState";

export type ConnectorsDependencies = {
  providers: ProviderRegistry;
  vault: Vault;
  jobs: Jobs;
  mailer: Mailer;
  secret: string;
  apiUrl: string;
  appUrl: string;
  now: () => Date;
};

class DuplicateIntegration extends Error {}

export const BACKFILL_QUEUE = "connector.backfill";
export const SYNC_QUEUE = "connector.sync";

const authPatternEnum: Record<string, ConnectionAuthPattern> = {
  oauth: "OAUTH",
  domain_oauth: "DOMAIN_OAUTH",
  credentials: "CREDENTIALS",
};

const redirectUriOf = (apiUrl: string, key: ConnectorKey) =>
  `${apiUrl.replace(/\/$/, "")}/api/v1/connectors/${familyOf(key)}/callback`;

export function providerOf(deps: ConnectorsDependencies, key: ConnectorKey) {
  const provider = deps.providers.get(key);
  if (!provider) throw new HttpError(422, "Este conector ainda não está disponível.");
  return provider;
}

export async function startAuthorization(
  auth: AuthContext,
  key: ConnectorKey,
  input: ConnectorStartInput,
  deps: ConnectorsDependencies,
): Promise<{ url: string }> {
  const provider = providerOf(deps, key);
  if (input.connectionId && !(await connectionOf(auth.clientId, key, input.connectionId))) {
    throw notFound("Integração não encontrada");
  }
  if (provider.authPattern === "credentials") {
    throw new HttpError(422, "Este conector usa credenciais, não autorização.");
  }
  if (provider.authPattern === "domain_oauth" && !input.domain) {
    throw new HttpError(422, "Informe o domínio da loja.");
  }
  const state = signOAuthState(
    {
      clientId: auth.clientId,
      userId: auth.userId,
      key,
      domain: input.domain,
      connectionId: input.connectionId,
      name: input.name,
    },
    deps.secret,
  );
  return {
    url: provider.authorizeUrl({
      state,
      redirectUri: redirectUriOf(deps.apiUrl, key),
      domain: input.domain,
    }),
  };
}

export async function stampConnected(
  clientId: string,
  key: ConnectorKey,
  now: Date,
): Promise<void> {
  const connector = connectorOf(key);
  await prismaClient.dataSource.upsert({
    where: { clientId_connectorKey: { clientId, connectorKey: key } },
    create: {
      clientId,
      connectorKey: key,
      name: connector.label,
      kind: connector.kind,
      status: "CONNECTED",
      position: 0,
    },
    update: { status: "CONNECTED" },
  });
  await prismaClient.connectionRequest.updateMany({
    where: { clientId, connectorKey: key, status: { in: ["REQUESTED", "IN_PROGRESS"] } },
    data: { status: "DONE", resolvedAt: now },
  });
}

type Target = { connectionId: string | null; name: string | null };

function accountFor(
  owner: { clientId: string; userId: string },
  key: ConnectorKey,
  authorized: Authorized,
  reconnecting: string | null,
  deps: ConnectorsDependencies,
) {
  return upsertAccount({
    clientId: owner.clientId,
    key,
    authPattern: authPatternEnum[providerOf(deps, key).authPattern] ?? "OAUTH",
    externalId: accountExternalId({
      reported: authorized.externalId,
      reconnecting,
      fresh: randomUUID(),
    }),
    externalLabel: authorized.externalLabel,
    sealedCredentials: deps.vault.seal(authorized.credentials),
    userId: owner.userId,
  });
}

async function saveConnection(
  owner: { clientId: string; userId: string },
  key: ConnectorKey,
  authorized: Authorized,
  deps: ConnectorsDependencies,
  target: Target,
): Promise<{ id: string; needsAccount: boolean }> {
  const now = deps.now();
  const chosen = target.connectionId
    ? await connectionOf(owner.clientId, key, target.connectionId)
    : null;
  const account = await accountFor(
    owner,
    key,
    authorized,
    chosen?.account.externalId ?? null,
    deps,
  );
  const onAccount = await connectionOnAccount(account.id, key);
  const taken = onAccount && (chosen ? onAccount.id !== chosen.id : target.name !== null);
  if (taken) throw new DuplicateIntegration();
  const existing = chosen ?? onAccount;
  const settings = reconnectSettings(authorized.settings ?? null, existing?.settings ?? null);
  const needsAccount = needsAccountOf(settings);
  const connection = await saveIntegration({
    existing,
    clientId: owner.clientId,
    key,
    accountId: account.id,
    userId: owner.userId,
    name: target.name,
    settings,
  });
  if (existing?.accountId !== account.id)
    await dropIfOrphan(owner.clientId, existing?.accountId ?? null);
  await stampConnected(owner.clientId, key, now);
  await recordAuthorized(
    owner,
    integrationLabel(key, existing?.name ?? target.name ?? ""),
    authorized.externalLabel,
  );
  if (needsAccount) return { id: connection.id, needsAccount };
  const incremental =
    Boolean(existing?.lastSyncAt) &&
    existing?.accountId === account.id &&
    !isPlaceholderId(authorized.externalId);
  await startImport(connection.id, incremental, deps);
  return { id: connection.id, needsAccount };
}

async function recordAuthorized(
  owner: { clientId: string; userId: string },
  connector: string,
  account: string,
) {
  const actor = await prismaClient.user.findUnique({
    where: { id: owner.userId },
    select: { role: true },
  });
  await recordActivity({ userId: owner.userId, role: actor?.role ?? "CLIENT" }, owner.clientId, {
    action: "CONNECTION_AUTHORIZED",
    connector,
    account,
  });
}

const startImport = (connectionId: string, incremental: boolean, deps: ConnectorsDependencies) =>
  incremental
    ? deps.jobs.send(SYNC_QUEUE, { connectionId }, { singletonKey: connectionId })
    : enqueueBackfill(connectionId, deps);

export const enqueueBackfill = (connectionId: string, deps: ConnectorsDependencies) =>
  deps.jobs.send(
    BACKFILL_QUEUE,
    { connectionId },
    { singletonKey: connectionId, retryLimit: 3, expireInMinutes: 6 * 60 },
  );

export async function completeCallback(
  pathKey: ConnectorKey,
  callback: { code: string; state: string; query: Record<string, string> },
  deps: ConnectorsDependencies,
): Promise<{ redirectTo: string }> {
  const state = verifyOAuthState(callback.state, deps.secret);
  const key = state && familyOf(state.key) === pathKey ? state.key : pathKey;
  const target = connectionsLink(deps.appUrl);
  const failed = (reason: ConnectorErrorReason) => ({
    redirectTo: `${target}?erro=${key}&motivo=${reason}`,
  });
  if (!state || state.key !== key) return failed("estado");
  if (!callback.code) return failed("cancelado");
  const provider = providerOf(deps, key);
  try {
    const authorized = await provider.exchangeCode({
      code: callback.code,
      redirectUri: redirectUriOf(deps.apiUrl, key),
      domain: state.domain,
      query: callback.query,
    });
    const saved = await saveConnection(state, key, authorized, deps, state);
    return {
      redirectTo: `${target}?aba=minhas&conectado=${key}${saved.needsAccount ? "&escolher=true" : ""}`,
    };
  } catch (error) {
    if (error instanceof DuplicateIntegration) return failed("duplicada");
    console.error(error);
    return failed("troca");
  }
}

export async function connectWithCredentials(
  auth: AuthContext,
  key: ConnectorKey,
  input: ConnectorCredentialsInput,
  deps: ConnectorsDependencies,
): Promise<void> {
  const provider = providerOf(deps, key);
  if (!provider.fromCredentials) throw new HttpError(422, "Este conector usa autorização.");
  const authorized = await provider.fromCredentials(input.fields);
  await saveConnection(auth, key, authorized, deps, { connectionId: null, name: null });
}

export async function dataReadiness(clientId: string): Promise<DataReadiness> {
  const [connections, orders, imports] = await Promise.all([
    prismaClient.connection.findMany({ where: { clientId }, select: { connectorKey: true } }),
    prismaClient.order.count({ where: { clientId }, take: 1 }),
    prismaClient.importJob.count({ where: { clientId, status: { in: ["DONE", "PARTIAL"] } } }),
  ]);
  return {
    hasSource: connections.length > 0 || orders > 0 || imports > 0,
    connectedKeys: connections.map((c) => c.connectorKey as ConnectorKey),
  };
}
