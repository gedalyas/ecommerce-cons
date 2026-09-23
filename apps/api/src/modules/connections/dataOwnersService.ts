import { prismaClient } from "@ecommerce/database/client";
import {
  keepsCutOnRelease,
  ownersFromRows,
  unclaimedKinds,
  type ConnectorKey,
  type DataKind,
  type DataOwner,
  type DataOwners,
} from "@ecommerce/contracts/connectors";

export async function dataOwnersOf(clientId: string): Promise<DataOwners> {
  const rows = await prismaClient.storeDataSource.findMany({
    where: { clientId },
    select: { kind: true, source: true },
  });
  return ownersFromRows(rows);
}

async function dropDisconnectedOwners(clientId: string): Promise<void> {
  const connections = await prismaClient.connection.findMany({
    where: { clientId },
    select: { connectorKey: true },
  });
  const live = ["system", "manual_csv", ...connections.map((c) => c.connectorKey)];
  await prismaClient.storeDataSource.deleteMany({ where: { clientId, source: { notIn: live } } });
}

export async function claimDataKinds(
  clientId: string,
  source: ConnectorKey,
  provides: readonly DataKind[],
): Promise<DataOwners> {
  await dropDisconnectedOwners(clientId);
  const owners = await dataOwnersOf(clientId);
  const claim = unclaimedKinds(provides, owners);
  if (claim.length === 0) return owners;
  await prismaClient.storeDataSource.createMany({
    data: claim.map((kind) => ({ clientId, kind, source })),
    skipDuplicates: true,
  });
  return dataOwnersOf(clientId);
}

export async function sinceOf(clientId: string, kind: DataKind): Promise<string | null> {
  const row = await prismaClient.storeDataSource.findUnique({
    where: { clientId_kind: { clientId, kind } },
    select: { since: true },
  });
  return row?.since ? row.since.toISOString().slice(0, 10) : null;
}

export async function ownerOf(clientId: string, kind: DataKind): Promise<DataOwner | null> {
  const row = await prismaClient.storeDataSource.findUnique({
    where: { clientId_kind: { clientId, kind } },
    select: { kind: true, source: true },
  });
  return row ? (ownersFromRows([row])[kind] ?? null) : null;
}

export async function releaseDataKinds(
  clientId: string,
  source: ConnectorKey,
  kinds: readonly DataKind[] | null = null,
): Promise<void> {
  const where = { clientId, source, ...(kinds ? { kind: { in: [...kinds] } } : {}) };
  const rows = await prismaClient.storeDataSource.findMany({
    where,
    select: { id: true, since: true },
  });
  const cut = rows
    .filter((r) => keepsCutOnRelease(r.since?.toISOString() ?? null))
    .map((r) => r.id);
  await prismaClient.storeDataSource.updateMany({
    where: { id: { in: cut } },
    data: { source: "system" },
  });
  await prismaClient.storeDataSource.deleteMany({ where: { ...where, id: { notIn: cut } } });
}
