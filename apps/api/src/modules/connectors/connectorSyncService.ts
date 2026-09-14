import { connectorOf, type ConnectorKey } from "@ecommerce/contracts/connectors";
import { prismaClient, type Prisma } from "@ecommerce/database/client";
import { recordActivity } from "@/modules/audit/contract";
import { refreshCustomers } from "@/modules/customers/contract";
import {
  writeSyncedAdSpend,
  writeSyncedOrders,
  writeSyncedSocial,
  writeSyncedTraffic,
} from "@/modules/imports/contract";
import type { Jobs } from "@/shared/jobs/jobs.types";
import type {
  ConnectorProvider,
  Credentials,
  RawKind,
  RawRow,
  SyncContext,
  SyncCursor,
} from "./connectorProvider.types";
import { BACKFILL_QUEUE, SYNC_QUEUE, type ConnectorsDependencies } from "./connectorsService";

const SYNC_ALL_QUEUE = "connector.sync-all";
const HOURLY = "0 * * * *";
const RAW_CHUNK = 200;
const ERROR_LIMIT = 500;

type JobData = { connectionId: string; reprocess?: boolean };

async function saveRaw(connectionId: string, now: Date, kind: RawKind, rows: RawRow[]) {
  for (let i = 0; i < rows.length; i += RAW_CHUNK) {
    const chunk = rows.slice(i, i + RAW_CHUNK);
    await prismaClient.$transaction(
      chunk.map((row) =>
        prismaClient.rawRecord.upsert({
          where: {
            connectionId_kind_externalId: { connectionId, kind, externalId: row.externalId },
          },
          create: {
            connectionId,
            kind,
            externalId: row.externalId,
            payload: row.payload as Prisma.InputJsonValue,
            fetchedAt: now,
          },
          update: { payload: row.payload as Prisma.InputJsonValue, fetchedAt: now },
        }),
      ),
    );
  }
}

type ConnectionRow = {
  id: string;
  clientId: string;
  connectorKey: string;
  externalId: string;
  credentials: string;
  syncCursor: unknown;
  settings: unknown;
  authorizedBy: string | null;
};

async function listRaw<T>(connectionId: string, kind: RawKind, skip: number, take: number) {
  const rows = await prismaClient.rawRecord.findMany({
    where: { connectionId, kind },
    orderBy: { externalId: "asc" },
    skip,
    take,
    select: { externalId: true, payload: true },
  });
  return rows.map((r) => ({ externalId: r.externalId, payload: r.payload as T }));
}

async function readRaw<T>(connectionId: string, kind: RawKind, externalId: string) {
  const row = await prismaClient.rawRecord.findUnique({
    where: { connectionId_kind_externalId: { connectionId, kind, externalId } },
    select: { payload: true },
  });
  return (row?.payload as T | undefined) ?? null;
}

function contextOf(
  row: ConnectionRow,
  credentials: Credentials,
  deps: ConnectorsDependencies,
  reprocess: boolean,
): SyncContext {
  const now = deps.now();
  return {
    connectionId: row.id,
    clientId: row.clientId,
    externalId: row.externalId,
    credentials,
    cursor: (row.syncCursor ?? {}) as SyncCursor,
    settings: (row.settings ?? {}) as Record<string, unknown>,
    reprocess,
    now,
    saveRaw: (kind, rows) => saveRaw(row.id, now, kind, rows),
    readRaw: (kind, externalId) => readRaw(row.id, kind, externalId),
    listRaw: (kind, skip, take) => listRaw(row.id, kind, skip, take),
    writeOrders: (orders) => writeSyncedOrders(row.clientId, orders),
    writeAdSpend: (rows) => writeSyncedAdSpend(row.clientId, rows),
    writeTraffic: (rows) => writeSyncedTraffic(row.clientId, rows),
    writeSocial: (input) => writeSyncedSocial(row.clientId, input),
  };
}

async function credentialsOf(
  row: ConnectionRow,
  provider: ConnectorProvider,
  deps: ConnectorsDependencies,
): Promise<Credentials> {
  const stored = deps.vault.open<Credentials>(row.credentials);
  if (!provider.refresh) return stored;
  const refreshed = await provider.refresh(stored, deps.now());
  if (!refreshed) return stored;
  await prismaClient.connection.update({
    where: { id: row.id },
    data: { credentials: deps.vault.seal(refreshed) },
  });
  return refreshed;
}

async function finish(
  row: ConnectionRow,
  cursor: SyncCursor,
  written: number,
  deps: ConnectorsDependencies,
) {
  const now = deps.now();
  await prismaClient.connection.update({
    where: { id: row.id },
    data: {
      stage: "PROCESSING",
      syncCursor: cursor as Prisma.InputJsonObject,
      lastSyncAt: now,
      lastError: null,
    },
  });
  await refreshCustomers(row.clientId);
  await prismaClient.connection.update({ where: { id: row.id }, data: { stage: "READY" } });
  await prismaClient.dataSource.updateMany({
    where: { clientId: row.clientId, connectorKey: row.connectorKey },
    data: { status: "CONNECTED", lastSyncedAt: now },
  });
  await recordActivity(
    { system: connectorOf(row.connectorKey as ConnectorKey).label },
    row.clientId,
    {
      action: "CONNECTION_SYNCED",
      connector: connectorOf(row.connectorKey as ConnectorKey).label,
      rows: written,
    },
  );
}

async function fail(row: ConnectionRow, error: unknown, deps: ConnectorsDependencies) {
  const message = (error instanceof Error ? error.message : String(error)).slice(0, ERROR_LIMIT);
  console.error(error);
  await prismaClient.connection.update({
    where: { id: row.id },
    data: { stage: "ERROR", lastError: message, lastSyncAt: deps.now() },
  });
  await prismaClient.dataSource.updateMany({
    where: { clientId: row.clientId, connectorKey: row.connectorKey },
    data: { status: "ERROR" },
  });
  await recordActivity(
    { system: connectorOf(row.connectorKey as ConnectorKey).label },
    row.clientId,
    {
      action: "CONNECTION_FAILED",
      connector: connectorOf(row.connectorKey as ConnectorKey).label,
      message,
    },
  );
}

async function run(data: JobData, mode: "backfill" | "sync", deps: ConnectorsDependencies) {
  const row = await prismaClient.connection.findUnique({ where: { id: data.connectionId } });
  if (!row) return;
  const provider = deps.providers.get(row.connectorKey as ConnectorKey);
  if (!provider) return;
  try {
    await prismaClient.connection.update({ where: { id: row.id }, data: { stage: "IMPORTING" } });
    const credentials = await credentialsOf(row, provider, deps);
    const context = contextOf(row, credentials, deps, data.reprocess === true);
    const result =
      mode === "backfill" ? await provider.backfill(context) : await provider.sync(context);
    await finish(row, result.cursor, result.written, deps);
  } catch (error) {
    await fail(row, error, deps);
    throw error;
  }
}

export async function registerConnectorJobs(
  jobs: Jobs,
  deps: ConnectorsDependencies,
): Promise<void> {
  await jobs.work<JobData>(BACKFILL_QUEUE, (data) => run(data, "backfill", deps));
  await jobs.work<JobData>(SYNC_QUEUE, (data) => run(data, "sync", deps));
  await jobs.work<object>(SYNC_ALL_QUEUE, async () => {
    const ready = await prismaClient.connection.findMany({
      where: { stage: { in: ["READY", "ERROR"] } },
      select: { id: true },
    });
    for (const { id } of ready) {
      await jobs.send(SYNC_QUEUE, { connectionId: id }, { singletonKey: id });
    }
  });
  await jobs.schedule(SYNC_ALL_QUEUE, HOURLY, {});
}
