import {
  connectorOf,
  type ConnectionSummary,
  type ConnectorCredentialsInput,
  type ConnectorErrorReason,
  type ConnectorKey,
  type ConnectorSettings,
  type ConnectorSettingsInput,
  type ConnectorStartInput,
  type DataReadiness,
  type StatusMappingTarget,
  familyOf,
} from "@ecommerce/contracts/connectors";
import { prismaClient, type Prisma } from "@ecommerce/database/client";
import { releaseDataKinds } from "@/modules/connections/contract";
import type { ConnectionAuthPattern } from "@ecommerce/database/enums";
import { recordActivity } from "@/modules/audit/contract";
import type { AuthContext } from "@/shared/http/auth.types";
import { HttpError, notFound } from "@/shared/http/httpError";
import type { Jobs } from "@/shared/jobs/jobs.types";
import type { Mailer } from "@/shared/mail/mailer.types";
import type { Vault } from "@/shared/crypto/vault";
import type { Authorized, ProviderRegistry } from "./connectorProvider.types";
import { connectionsLink } from "./connectionMail";
import {
  connectionOfKey,
  dropIfOrphan,
  saveIntegration,
  upsertAccount,
} from "./connectorAccountsService";
import { needsAccountOf, reconnectSettings } from "./connectionSettings";
import { signOAuthState, verifyOAuthState } from "./oauthState";
import { defaultStatusMap } from "./blingOrders";

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

export function startAuthorization(
  auth: AuthContext,
  key: ConnectorKey,
  input: ConnectorStartInput,
  deps: ConnectorsDependencies,
): { url: string } {
  const provider = providerOf(deps, key);
  if (provider.authPattern === "credentials") {
    throw new HttpError(422, "Este conector usa credenciais, não autorização.");
  }
  if (provider.authPattern === "domain_oauth" && !input.domain) {
    throw new HttpError(422, "Informe o domínio da loja.");
  }
  const state = signOAuthState(
    { clientId: auth.clientId, userId: auth.userId, key, domain: input.domain },
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

async function stampConnected(clientId: string, key: ConnectorKey, now: Date): Promise<void> {
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

async function saveConnection(
  owner: { clientId: string; userId: string },
  key: ConnectorKey,
  authorized: Authorized,
  deps: ConnectorsDependencies,
): Promise<{ id: string; needsAccount: boolean }> {
  const provider = providerOf(deps, key);
  const now = deps.now();
  const existing = await connectionOfKey(owner.clientId, key);
  const settings = reconnectSettings(authorized.settings ?? null, existing?.settings ?? null);
  const needsAccount = needsAccountOf(settings);
  const account = await upsertAccount({
    clientId: owner.clientId,
    key,
    authPattern: authPatternEnum[provider.authPattern] ?? "OAUTH",
    externalId: authorized.externalId,
    externalLabel: authorized.externalLabel,
    sealedCredentials: deps.vault.seal(authorized.credentials),
    userId: owner.userId,
  });
  const connection = await saveIntegration({
    existing,
    clientId: owner.clientId,
    key,
    accountId: account.id,
    userId: owner.userId,
    settings,
  });
  if (existing?.accountId !== account.id)
    await dropIfOrphan(owner.clientId, existing?.accountId ?? null);
  await stampConnected(owner.clientId, key, now);
  await recordAuthorized(owner, key, authorized.externalLabel);
  if (needsAccount) return { id: connection.id, needsAccount };
  if (existing?.lastSyncAt && existing.accountId === account.id) {
    await deps.jobs.send(
      SYNC_QUEUE,
      { connectionId: connection.id },
      { singletonKey: connection.id },
    );
  } else {
    await enqueueBackfill(connection.id, deps);
  }
  return { id: connection.id, needsAccount };
}

async function recordAuthorized(
  owner: { clientId: string; userId: string },
  key: ConnectorKey,
  account: string,
) {
  const actor = await prismaClient.user.findUnique({
    where: { id: owner.userId },
    select: { role: true },
  });
  await recordActivity({ userId: owner.userId, role: actor?.role ?? "CLIENT" }, owner.clientId, {
    action: "CONNECTION_AUTHORIZED",
    connector: connectorOf(key).label,
    account,
  });
}

const enqueueBackfill = (connectionId: string, deps: ConnectorsDependencies) =>
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
    const saved = await saveConnection(state, key, authorized, deps);
    return {
      redirectTo: `${target}?aba=minhas&conectado=${key}${saved.needsAccount ? "&escolher=true" : ""}`,
    };
  } catch (error) {
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
  await saveConnection(auth, key, authorized, deps);
}

export async function disconnect(auth: AuthContext, key: ConnectorKey): Promise<void> {
  const existing = await connectionOfKey(auth.clientId, key);
  if (!existing) throw notFound("Conexão não encontrada");
  const removed = await prismaClient.connection.findMany({
    where: { clientId: auth.clientId, connectorKey: key },
    select: { accountId: true },
  });
  await prismaClient.connection.deleteMany({
    where: { clientId: auth.clientId, connectorKey: key },
  });
  for (const { accountId } of removed) await dropIfOrphan(auth.clientId, accountId);
  await releaseDataKinds(auth.clientId, key);
  await prismaClient.dataSource.updateMany({
    where: { clientId: auth.clientId, connectorKey: key },
    data: { status: "NOT_CONNECTED" },
  });
  await recordActivity(auth, auth.clientId, {
    action: "CONNECTION_REMOVED",
    connector: connectorOf(key).label,
    account: existing.account.externalLabel,
  });
}

export async function triggerSync(
  auth: AuthContext,
  key: ConnectorKey,
  deps: ConnectorsDependencies,
): Promise<void> {
  const existing = await connectionOfKey(auth.clientId, key);
  if (!existing) throw notFound("Conexão não encontrada");
  const queue = existing.stage === "AUTHORIZED" ? BACKFILL_QUEUE : SYNC_QUEUE;
  await deps.jobs.send(queue, { connectionId: existing.id }, { singletonKey: existing.id });
}

const summarySelect = {
  connectorKey: true,
  stage: true,
  account: { select: { externalLabel: true } },
  lastSyncAt: true,
  lastError: true,
  settings: true,
} as const;

const toSummary = (
  c: Prisma.ConnectionGetPayload<{ select: typeof summarySelect }>,
): ConnectionSummary => ({
  stage: c.stage,
  externalLabel: c.account.externalLabel,
  lastSyncAt: c.lastSyncAt?.toISOString() ?? null,
  lastError: c.lastError,
  needsAccount: needsAccountOf(c.settings),
});

export async function connectionSummariesFor(
  clientId: string,
): Promise<Map<ConnectorKey, ConnectionSummary>> {
  const rows = await prismaClient.connection.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    select: summarySelect,
  });
  return new Map(rows.map((r) => [r.connectorKey as ConnectorKey, toSummary(r)]));
}

async function connectionRow(auth: AuthContext, key: ConnectorKey) {
  const row = await connectionOfKey(auth.clientId, key);
  if (!row) throw notFound("Conexão não encontrada");
  return row;
}

export async function connectorSettings(
  auth: AuthContext,
  key: ConnectorKey,
  deps: ConnectorsDependencies,
): Promise<ConnectorSettings> {
  const provider = providerOf(deps, key);
  if (!provider.describeSettings) throw new HttpError(422, "Este conector não tem configurações.");
  const row = await connectionRow(auth, key);
  const described = await provider.describeSettings(deps.vault.open(row.account.credentials));
  const stored = (row.settings ?? {}) as StoredSettings;
  const statuses = described.statuses ?? [];
  return {
    statuses,
    statusMap: { ...defaultStatusMap(statuses), ...(stored.statusMap ?? {}) },
    accounts: described.accounts ?? [],
    accountId: stored.accountId ?? null,
  };
}

type StoredSettings = {
  statusMap?: Record<string, StatusMappingTarget>;
  accountId?: string | null;
};

export async function saveConnectorSettings(
  auth: AuthContext,
  key: ConnectorKey,
  input: ConnectorSettingsInput,
  deps: ConnectorsDependencies,
): Promise<void> {
  providerOf(deps, key);
  const row = await connectionRow(auth, key);
  const stored = (row.settings ?? {}) as StoredSettings;
  const settings = {
    ...stored,
    statusMap: input.statusMap,
    accountId: input.accountId ?? stored.accountId ?? null,
  } as Prisma.InputJsonObject;
  await prismaClient.connection.update({ where: { id: row.id }, data: { settings } });
  if (row.stage === "AUTHORIZED" && row.lastSyncAt === null) {
    await enqueueBackfill(row.id, deps);
    return;
  }
  await deps.jobs.send(
    SYNC_QUEUE,
    { connectionId: row.id, reprocess: true },
    { singletonKey: `${row.id}:reprocess` },
  );
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
