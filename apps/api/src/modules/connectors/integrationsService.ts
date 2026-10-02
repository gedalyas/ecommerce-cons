import {
  connectorOf,
  familyOf,
  type ConnectionCreateInput,
  type ConnectionSummary,
  type ConnectorAccountSummary,
  type ConnectorKey,
  type ConnectorSettings,
  type ConnectorSettingsInput,
  type StatusMappingTarget,
} from "@ecommerce/contracts/connectors";
import { Prisma, prismaClient } from "@ecommerce/database/client";
import { recordActivity } from "@/modules/audit/contract";
import { releaseDataKinds, syncLabelOf } from "@/modules/connections/contract";
import { currentDay } from "@/shared/config/clock";
import type { AuthContext } from "@/shared/http/auth.types";
import { HttpError, notFound } from "@/shared/http/httpError";
import { defaultStatusMap } from "./blingOrders";
import { needsAccountOf } from "./connectionSettings";
import { integrationLabel } from "./integrationLabel";
import {
  accountOf,
  connectionOf,
  connectionOnAccount,
  dropIfOrphan,
  saveIntegration,
} from "./connectorAccountsService";
import {
  BACKFILL_QUEUE,
  enqueueBackfill,
  providerOf,
  stampConnected,
  SYNC_QUEUE,
  type ConnectorsDependencies,
} from "./connectorsService";

const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

async function integrationOf(auth: AuthContext, key: ConnectorKey, id: string) {
  const row = await connectionOf(auth.clientId, key, id);
  if (!row) throw notFound("Integração não encontrada");
  return row;
}

export async function disconnect(auth: AuthContext, key: ConnectorKey, id: string): Promise<void> {
  const row = await integrationOf(auth, key, id);
  await prismaClient.connection.delete({ where: { id: row.id } });
  await dropIfOrphan(auth.clientId, row.accountId);
  const remaining = await prismaClient.connection.count({
    where: { clientId: auth.clientId, connectorKey: key },
  });
  if (remaining === 0) {
    await releaseDataKinds(auth.clientId, key);
    await prismaClient.dataSource.updateMany({
      where: { clientId: auth.clientId, connectorKey: key },
      data: { status: "NOT_CONNECTED" },
    });
  }
  await recordActivity(auth, auth.clientId, {
    action: "CONNECTION_REMOVED",
    connector: integrationLabel(key, row.name),
    account: row.account.externalLabel,
  });
}

export async function triggerSync(
  auth: AuthContext,
  key: ConnectorKey,
  id: string,
  deps: ConnectorsDependencies,
): Promise<void> {
  const row = await integrationOf(auth, key, id);
  const queue = row.stage === "AUTHORIZED" ? BACKFILL_QUEUE : SYNC_QUEUE;
  await deps.jobs.send(queue, { connectionId: row.id }, { singletonKey: row.id });
}

type StoredSettings = {
  statusMap?: Record<string, StatusMappingTarget>;
  accountId?: string | null;
};

export async function connectorSettings(
  auth: AuthContext,
  key: ConnectorKey,
  id: string,
  deps: ConnectorsDependencies,
): Promise<ConnectorSettings> {
  const provider = providerOf(deps, key);
  if (!provider.describeSettings) throw new HttpError(422, "Este conector não tem configurações.");
  const row = await integrationOf(auth, key, id);
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

export async function saveConnectorSettings(
  auth: AuthContext,
  key: ConnectorKey,
  id: string,
  input: ConnectorSettingsInput,
  deps: ConnectorsDependencies,
): Promise<void> {
  providerOf(deps, key);
  const row = await integrationOf(auth, key, id);
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

export async function createOnAccount(
  auth: AuthContext,
  key: ConnectorKey,
  input: ConnectionCreateInput,
  deps: ConnectorsDependencies,
): Promise<{ id: string }> {
  providerOf(deps, key);
  const account = await accountOf(auth.clientId, input.accountId);
  if (!account || account.family !== familyOf(key)) throw notFound("Conta não encontrada");
  if (await connectionOnAccount(account.id, key)) {
    throw new HttpError(409, "Esta conta já tem essa integração.");
  }
  const created = await saveIntegration({
    existing: null,
    clientId: auth.clientId,
    key,
    accountId: account.id,
    userId: auth.userId,
    name: input.name,
    settings: null,
  }).catch((error: unknown) => {
    if (isUniqueViolation(error)) throw new HttpError(409, "Esta conta já tem essa integração.");
    throw error;
  });
  await stampConnected(auth.clientId, key, deps.now());
  await recordActivity(auth, auth.clientId, {
    action: "CONNECTION_AUTHORIZED",
    connector: integrationLabel(key, input.name),
    account: account.externalLabel,
  });
  await enqueueBackfill(created.id, deps);
  return created;
}

const summarySelect = {
  id: true,
  name: true,
  accountId: true,
  connectorKey: true,
  stage: true,
  account: { select: { externalLabel: true } },
  lastSyncAt: true,
  lastError: true,
  settings: true,
} as const;

const toSummary = (
  c: Prisma.ConnectionGetPayload<{ select: typeof summarySelect }>,
  today: string,
): ConnectionSummary => ({
  id: c.id,
  name: c.name,
  accountId: c.accountId,
  stage: c.stage,
  syncLabel: syncLabelOf(c.stage === "ERROR" ? "ERROR" : "CONNECTED", c.lastSyncAt, today),
  externalLabel: c.account.externalLabel,
  lastSyncAt: c.lastSyncAt?.toISOString() ?? null,
  lastError: c.lastError,
  needsAccount: needsAccountOf(c.settings),
});

type StoreIntegrations = {
  byKey: Map<ConnectorKey, ConnectionSummary[]>;
  accounts: ConnectorAccountSummary[];
};

export async function connectionSummariesFor(clientId: string): Promise<StoreIntegrations> {
  const [rows, accounts] = await Promise.all([
    prismaClient.connection.findMany({
      where: { clientId },
      orderBy: { createdAt: "asc" },
      select: summarySelect,
    }),
    prismaClient.connectorAccount.findMany({
      where: { clientId },
      orderBy: { createdAt: "asc" },
      select: { id: true, family: true, externalLabel: true },
    }),
  ]);
  const byKey = new Map<ConnectorKey, ConnectionSummary[]>();
  for (const row of rows) {
    const key = row.connectorKey as ConnectorKey;
    byKey.set(key, [...(byKey.get(key) ?? []), toSummary(row, currentDay())]);
  }
  return {
    byKey,
    accounts: accounts.map((a) => ({
      id: a.id,
      family: a.family as ConnectorKey,
      label: a.externalLabel || connectorOf(a.family as ConnectorKey).label,
    })),
  };
}
