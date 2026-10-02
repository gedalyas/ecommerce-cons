import {
  blockedKinds,
  conflictingOwner,
  connectorOf,
  daysSince,
  ordersSince,
  ownerConflictMessage,
  providesKind,
  type ConnectorKey,
  type DataKind,
  type DataOwners,
} from "@ecommerce/contracts/connectors";
import { claimDataKinds, ownerOf, sinceOf } from "@/modules/connections/contract";
import { prismaClient, type Prisma } from "@ecommerce/database/client";
import { recordActivity } from "@/modules/audit/contract";
import { refreshCustomers } from "@/modules/customers/contract";
import {
  writeSyncedAdSpend,
  writeSyncedKeywords,
  writeSyncedOrders,
  writeSyncedProducts,
  writeSyncedSocial,
  writeSyncedTraffic,
  writeSyncedTrafficDetail,
  trafficDetailSince,
  type ProductSheetRow,
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
import { connectionFailedMail, connectionsLink } from "./connectionMail";
import { latestCredentials, saveRefreshed, withAccount } from "./connectorAccountsService";
import { credentialsAfterRefresh, type RefreshOutcome } from "./refreshRace";
import { BACKFILL_QUEUE, SYNC_QUEUE, type ConnectorsDependencies } from "./connectorsService";

const SYNC_ALL_QUEUE = "connector.sync-all";
const HOURLY = "0 * * * *";
const RAW_CHUNK = 200;
const ERROR_LIMIT = 500;
const REFRESH_SETTLE_MS = 1500;

const settle = (ms: number) => new Promise((done) => setTimeout(done, ms));

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
  account: { id: string; externalId: string; credentials: string };
  syncCursor: unknown;
  settings: unknown;
  authorizedBy: string | null;
  stage: string;
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

const productsWriter =
  (clientId: string, key: ConnectorKey, now: Date) => async (rows: ProductSheetRow[]) => {
    const [products, stock] = await Promise.all([
      ownerOf(clientId, "products"),
      ownerOf(clientId, "stock"),
    ]);
    if (products !== key) return 0;
    const known = stock === key ? rows : rows.map((r) => ({ ...r, stock: null }));
    return writeSyncedProducts(clientId, known, now);
  };

function contextOf(
  row: ConnectionRow,
  credentials: Credentials,
  deps: ConnectorsDependencies,
  reprocess: boolean,
  { owners, cuts }: { owners: DataOwners; cuts: { sales: string | null; traffic: string | null } },
): SyncContext {
  const now = deps.now();
  const key = row.connectorKey as ConnectorKey;
  const provides = (kind: DataKind) =>
    providesKind(key, kind) && conflictingOwner(kind, key, owners) == null;
  return {
    connectionId: row.id,
    clientId: row.clientId,
    externalId: row.account.externalId,
    credentials,
    cursor: (row.syncCursor ?? {}) as SyncCursor,
    settings: (row.settings ?? {}) as Record<string, unknown>,
    reprocess,
    now,
    accepts: provides,
    saveRaw: (kind, rows) => saveRaw(row.id, now, kind, rows),
    readRaw: (kind, externalId) => readRaw(row.id, kind, externalId),
    listRaw: (kind, skip, take) => listRaw(row.id, kind, skip, take),
    writeOrders: async (orders) =>
      provides("sales") && (await ownerOf(row.clientId, "sales")) === key
        ? writeSyncedOrders(row.clientId, ordersSince(orders, cuts.sales), {
            source: key,
            connectionId: row.id,
          })
        : 0,
    writeProducts: productsWriter(row.clientId, key, now),
    writeAdSpend: (rows) =>
      provides("ad_spend") ? writeSyncedAdSpend(row.clientId, rows) : Promise.resolve(0),
    writeTraffic: (rows) =>
      provides("traffic")
        ? writeSyncedTraffic(row.clientId, daysSince(rows, cuts.traffic))
        : Promise.resolve(0),
    writeKeywords: (rows) =>
      provides("ad_spend") ? writeSyncedKeywords(row.clientId, rows) : Promise.resolve(0),
    writeTrafficDetail: (detail) =>
      provides("traffic")
        ? writeSyncedTrafficDetail(row.clientId, trafficDetailSince(detail, cuts.traffic))
        : Promise.resolve(0),
    writeSocial: (input) =>
      provides("social") ? writeSyncedSocial(row.clientId, input) : Promise.resolve(0),
  };
}

async function credentialsOf(
  row: ConnectionRow,
  provider: ConnectorProvider,
  deps: ConnectorsDependencies,
): Promise<Credentials> {
  const read = row.account.credentials;
  const stored = deps.vault.open<Credentials>(read);
  if (!provider.refresh) return stored;
  const resolve = async (outcome: RefreshOutcome, own: Credentials | null) => {
    const latest = await latestCredentials(row.account.id);
    const use = credentialsAfterRefresh({ outcome, read, latest });
    return use === "latest" && latest ? deps.vault.open<Credentials>(latest) : own;
  };
  let refreshed: Credentials | null;
  try {
    refreshed = await provider.refresh(stored, deps.now());
  } catch (error) {
    const recovered =
      (await resolve("failed", null)) ??
      (await settle(REFRESH_SETTLE_MS).then(() => resolve("failed", null)));
    if (recovered) return recovered;
    throw error;
  }
  if (!refreshed) return stored;
  if (await saveRefreshed(row.account.id, read, deps.vault.seal(refreshed))) return refreshed;
  return (await resolve("conflict", refreshed)) ?? refreshed;
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

async function notifyFailure(
  row: ConnectionRow,
  connector: string,
  message: string,
  deps: ConnectorsDependencies,
) {
  const [store, users] = await Promise.all([
    prismaClient.client.findUnique({ where: { id: row.clientId }, select: { name: true } }),
    prismaClient.user.findMany({
      where: { clientId: row.clientId, role: "CLIENT" },
      select: { email: true, name: true },
    }),
  ]);
  for (const user of users) {
    await deps.mailer.send(
      connectionFailedMail({
        to: user.email,
        name: user.name,
        storeName: store?.name ?? "",
        connector,
        message,
        link: connectionsLink(deps.appUrl),
      }),
    );
  }
}

async function flagBlocked(row: ConnectionRow, blocked: readonly DataKind[], owners: DataOwners) {
  const kind = blocked[0];
  const owner = kind ? owners[kind] : undefined;
  if (!kind || !owner || owner === "system") return;
  await prismaClient.connection.update({
    where: { id: row.id },
    data: { stage: "ERROR", lastError: ownerConflictMessage(kind, owner) },
  });
  await prismaClient.dataSource.updateMany({
    where: { clientId: row.clientId, connectorKey: row.connectorKey },
    data: { status: "ERROR" },
  });
}

async function fail(row: ConnectionRow, error: unknown, deps: ConnectorsDependencies) {
  const message = (error instanceof Error ? error.message : String(error)).slice(0, ERROR_LIMIT);
  console.error(error);
  const firstFailure = row.stage !== "ERROR";
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
  if (!firstFailure) return;
  await notifyFailure(
    row,
    connectorOf(row.connectorKey as ConnectorKey).label,
    message,
    deps,
  ).catch((mailError: unknown) => console.error(mailError));
}

async function run(data: JobData, mode: "backfill" | "sync", deps: ConnectorsDependencies) {
  const row = await prismaClient.connection.findUnique({
    where: { id: data.connectionId },
    include: withAccount,
  });
  if (!row) return;
  const provider = deps.providers.get(row.connectorKey as ConnectorKey);
  if (!provider) return;
  try {
    await prismaClient.connection.update({ where: { id: row.id }, data: { stage: "IMPORTING" } });
    const credentials = await credentialsOf(row, provider, deps);
    const key = row.connectorKey as ConnectorKey;
    const provides = connectorOf(key).provides;
    if ((await prismaClient.connection.count({ where: { id: row.id } })) === 0) return;
    const owners = await claimDataKinds(row.clientId, key, provides);
    const cuts = {
      sales: await sinceOf(row.clientId, "sales"),
      traffic: await sinceOf(row.clientId, "traffic"),
    };
    const context = contextOf(row, credentials, deps, data.reprocess === true, { owners, cuts });
    const result =
      mode === "backfill" ? await provider.backfill(context) : await provider.sync(context);
    await finish(row, result.cursor, result.written, deps);
    await flagBlocked(row, blockedKinds(provides, key, owners), owners);
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
