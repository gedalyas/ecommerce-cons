import { connectorKeys, connectorOf, type ConnectorKey } from "./connectorCatalog";
import { dataKindLabel, dataKinds, type DataKind } from "./dataKinds";

const exclusiveDataKinds: readonly DataKind[] = [
  "sales",
  "products",
  "stock",
  "customers",
  "traffic",
];

export type DataOwners = Partial<Record<DataKind, ConnectorKey>>;

const isExclusiveKind = (kind: DataKind): boolean => exclusiveDataKinds.includes(kind);

const isDataKind = (value: string): value is DataKind =>
  (dataKinds as readonly string[]).includes(value);

const isConnectorKey = (value: string): value is ConnectorKey =>
  (connectorKeys as readonly string[]).includes(value);

export function ownersFromRows(rows: readonly { kind: string; source: string }[]): DataOwners {
  const owners: DataOwners = {};
  for (const { kind, source } of rows)
    if (isDataKind(kind) && isConnectorKey(source)) owners[kind] = source;
  return owners;
}

export const unclaimedKinds = (provides: readonly DataKind[], owners: DataOwners): DataKind[] =>
  provides.filter((kind) => isExclusiveKind(kind) && owners[kind] == null);

export function conflictingOwner(
  kind: DataKind,
  source: ConnectorKey,
  owners: DataOwners,
): ConnectorKey | null {
  const owner = owners[kind];
  return isExclusiveKind(kind) && owner != null && owner !== source ? owner : null;
}

export const blockedKinds = (
  provides: readonly DataKind[],
  source: ConnectorKey,
  owners: DataOwners,
): DataKind[] => provides.filter((kind) => conflictingOwner(kind, source, owners) != null);

export function ownerConflictMessage(kind: DataKind, owner: ConnectorKey): string {
  const label = dataKindLabel[kind].toLowerCase();
  return `A fonte de ${label} desta loja é ${connectorOf(owner).label}. Para usar outra fonte, troque em Conexões.`;
}
