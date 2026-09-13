import {
  connectorOf,
  type ConnectionSummary,
  type ConnectorCredentialsInput,
  type ConnectorKey,
  type ConnectorStartInput,
  type DataReadiness,
} from "@ecommerce/contracts/connectors";
import { prismaClient, type Prisma } from "@ecommerce/database/client";
import type { ConnectionAuthPattern } from "@ecommerce/database/enums";
import { recordActivity } from "@/modules/audit/contract";
import type { AuthContext } from "@/shared/http/auth.types";
import { HttpError, notFound } from "@/shared/http/httpError";
import type { Jobs } from "@/shared/jobs/jobs.types";
import type { Vault } from "@/shared/crypto/vault";
import type { Authorized, ProviderRegistry } from "./connectorProvider.types";
import { signOAuthState, verifyOAuthState } from "./oauthState";

export type ConnectorsDependencies = {
  providers: ProviderRegistry;
  vault: Vault;
  jobs: Jobs;
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
  `${apiUrl.replace(/\/$/, "")}/api/v1/connectors/${key}/callback`;

function providerOf(deps: ConnectorsDependencies, key: ConnectorKey) {
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
): Promise<string> {
  const provider = providerOf(deps, key);
  const now = deps.now();
  const data = {
    authPattern: authPatternEnum[provider.authPattern] ?? "OAUTH",
    externalId: authorized.externalId,
    externalLabel: authorized.externalLabel,
    credentials: deps.vault.seal(authorized.credentials),
    stage: "AUTHORIZED" as const,
    lastError: null,
    authorizedBy: owner.userId,
  };
  const connection = await prismaClient.connection.upsert({
    where: { clientId_connectorKey: { clientId: owner.clientId, connectorKey: key } },
    create: { clientId: owner.clientId, connectorKey: key, ...data },
    update: data,
    select: { id: true },
  });
  const connector = connectorOf(key);
  await stampConnected(owner.clientId, key, now);
  const actor = await prismaClient.user.findUnique({
    where: { id: owner.userId },
    select: { role: true },
  });
  await recordActivity({ userId: owner.userId, role: actor?.role ?? "CLIENT" }, owner.clientId, {
    action: "CONNECTION_AUTHORIZED",
    connector: connector.label,
    account: authorized.externalLabel,
  });
  await deps.jobs.send(
    BACKFILL_QUEUE,
    { connectionId: connection.id },
    { singletonKey: connection.id, retryLimit: 3, expireInMinutes: 6 * 60 },
  );
  return connection.id;
}

export async function completeCallback(
  key: ConnectorKey,
  code: string,
  stateToken: string,
  deps: ConnectorsDependencies,
): Promise<{ redirectTo: string }> {
  const state = verifyOAuthState(stateToken, deps.secret);
  const target = `${deps.appUrl.replace(/\/$/, "")}/conexoes`;
  if (!state || state.key !== key) return { redirectTo: `${target}?erro=estado` };
  const provider = providerOf(deps, key);
  try {
    const authorized = await provider.exchangeCode({
      code,
      redirectUri: redirectUriOf(deps.apiUrl, key),
      domain: state.domain,
    });
    await saveConnection(state, key, authorized, deps);
    return { redirectTo: `${target}?conectado=${key}` };
  } catch (error) {
    console.error(error);
    return { redirectTo: `${target}?erro=${key}` };
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
  const existing = await prismaClient.connection.findUnique({
    where: { clientId_connectorKey: { clientId: auth.clientId, connectorKey: key } },
    select: { id: true, externalLabel: true },
  });
  if (!existing) throw notFound("Conexão não encontrada");
  await prismaClient.connection.delete({ where: { id: existing.id } });
  await prismaClient.dataSource.updateMany({
    where: { clientId: auth.clientId, connectorKey: key },
    data: { status: "NOT_CONNECTED" },
  });
  await recordActivity(auth, auth.clientId, {
    action: "CONNECTION_REMOVED",
    connector: connectorOf(key).label,
    account: existing.externalLabel,
  });
}

export async function triggerSync(
  auth: AuthContext,
  key: ConnectorKey,
  deps: ConnectorsDependencies,
): Promise<void> {
  const existing = await prismaClient.connection.findUnique({
    where: { clientId_connectorKey: { clientId: auth.clientId, connectorKey: key } },
    select: { id: true, stage: true },
  });
  if (!existing) throw notFound("Conexão não encontrada");
  const queue = existing.stage === "AUTHORIZED" ? BACKFILL_QUEUE : SYNC_QUEUE;
  await deps.jobs.send(queue, { connectionId: existing.id }, { singletonKey: existing.id });
}

const summarySelect = {
  connectorKey: true,
  stage: true,
  externalLabel: true,
  lastSyncAt: true,
  lastError: true,
} as const;

const toSummary = (
  c: Prisma.ConnectionGetPayload<{ select: typeof summarySelect }>,
): ConnectionSummary => ({
  stage: c.stage,
  externalLabel: c.externalLabel,
  lastSyncAt: c.lastSyncAt?.toISOString() ?? null,
  lastError: c.lastError,
});

export async function connectionSummariesFor(
  clientId: string,
): Promise<Map<ConnectorKey, ConnectionSummary>> {
  const rows = await prismaClient.connection.findMany({
    where: { clientId },
    select: summarySelect,
  });
  return new Map(rows.map((r) => [r.connectorKey as ConnectorKey, toSummary(r)]));
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
