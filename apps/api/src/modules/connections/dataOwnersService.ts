import { prismaClient } from "@ecommerce/database/client";
import {
  ownersFromRows,
  unclaimedKinds,
  type ConnectorKey,
  type DataKind,
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
  const live = ["manual_csv", ...connections.map((c) => c.connectorKey)];
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

export async function releaseDataKinds(
  clientId: string,
  source: ConnectorKey,
  kinds: readonly DataKind[] | null = null,
): Promise<void> {
  await prismaClient.storeDataSource.deleteMany({
    where: { clientId, source, ...(kinds ? { kind: { in: [...kinds] } } : {}) },
  });
}
