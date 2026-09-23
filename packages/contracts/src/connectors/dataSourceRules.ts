import { connectorKeys, connectorOf, type ConnectorKey } from "./connectorCatalog";
import { dataKindLabel, dataKinds, type DataKind } from "./dataKinds";

export const exclusiveDataKinds = [
  "sales",
  "products",
  "stock",
  "customers",
  "traffic",
] as const satisfies readonly DataKind[];

const derivableKinds: readonly DataKind[] = ["products", "customers"];

export type DataOwner = ConnectorKey | "system";

export type DataOwners = Partial<Record<DataKind, DataOwner>>;

export const isExclusiveKind = (kind: DataKind): boolean =>
  (exclusiveDataKinds as readonly DataKind[]).includes(kind);

const isDataKind = (value: string): value is DataKind =>
  (dataKinds as readonly string[]).includes(value);

const isDataOwner = (value: string): value is DataOwner =>
  value === "system" || (connectorKeys as readonly string[]).includes(value);

export function ownersFromRows(rows: readonly { kind: string; source: string }[]): DataOwners {
  const owners: DataOwners = {};
  for (const { kind, source } of rows)
    if (isDataKind(kind) && isDataOwner(source)) owners[kind] = source;
  return owners;
}

export const unclaimedKinds = (provides: readonly DataKind[], owners: DataOwners): DataKind[] =>
  provides.filter((kind) => isExclusiveKind(kind) && owners[kind] == null);

export function conflictingOwner(
  kind: DataKind,
  source: ConnectorKey,
  owners: DataOwners,
): DataOwner | null {
  const owner = owners[kind];
  return isExclusiveKind(kind) && owner != null && owner !== source ? owner : null;
}

export const blockedKinds = (
  provides: readonly DataKind[],
  source: ConnectorKey,
  owners: DataOwners,
): DataKind[] => provides.filter((kind) => conflictingOwner(kind, source, owners) != null);

export type KindOwnership = {
  kind: DataKind;
  label: string;
  owner: "this" | "other" | "none";
  ownerLabel: string | null;
  text: string;
};

export function kindOwnership(
  provides: readonly DataKind[],
  source: ConnectorKey,
  owners: DataOwners,
): KindOwnership[] {
  return provides.map((kind) => {
    const owner = owners[kind] ?? null;
    const connected = owner == null || owner === "system" ? null : owner;
    const ownerLabel = connected == null ? null : connectorOf(connected).label;
    const holder = connected == null ? "none" : connected === source ? "this" : "other";
    const text =
      holder === "this"
        ? "Vem desta integração"
        : holder === "other"
          ? `Hoje vem de ${ownerLabel}`
          : derivableKinds.includes(kind)
            ? "Gerado no sistema, a partir dos pedidos"
            : "Ainda sem fonte";
    return { kind, label: dataKindLabel[kind], owner: holder, ownerLabel, text };
  });
}

export function choiceProblem(
  kind: DataKind,
  source: ConnectorKey | null,
  connected: boolean,
): string | null {
  if (!isExclusiveKind(kind)) return "Este tipo de dado aceita várias fontes ao mesmo tempo.";
  if (source == null) return null;
  const { label, provides } = connectorOf(source);
  if (!provides.includes(kind)) return `${label} não fornece ${dataKindLabel[kind].toLowerCase()}.`;
  return connected || source === "manual_csv"
    ? null
    : `Conecte ${label} antes de usá-la como fonte.`;
}

export const choiceSince = (
  previous: DataOwner | null,
  previousSince: string | null,
  today: string,
): string | null =>
  previous == null || (previous === "system" && previousSince == null) ? null : today;

export const keepsCutOnRelease = (since: string | null): boolean => since != null;

export const ordersSince = <T extends { placedAt: string }>(
  orders: readonly T[],
  since: string | null,
): T[] => (since == null ? [...orders] : orders.filter((o) => o.placedAt.slice(0, 10) >= since));

export const daysSince = <T extends { date: string }>(
  rows: readonly T[],
  since: string | null,
): T[] => (since == null ? [...rows] : rows.filter((r) => r.date.slice(0, 10) >= since));

export function switchNotice(
  row: Pick<KindOwnership, "kind" | "label" | "owner" | "ownerLabel">,
  sourceLabel: string,
): string {
  const kind = row.label.toLowerCase();
  if (row.owner === "this") {
    return derivableKinds.includes(row.kind)
      ? `A partir de hoje, ${kind} voltam a ser gerados pelo sistema, a partir dos pedidos.`
      : `A partir de hoje, ${kind} ficam sem fonte até você escolher outra.`;
  }
  const history =
    row.owner === "other" ? ` O histórico até ontem continua vindo de ${row.ownerLabel}.` : "";
  return `A partir de hoje, ${kind} passam a vir de ${sourceLabel}.${history}`;
}

export function ownerConflictMessage(kind: DataKind, owner: DataOwner): string {
  const label = dataKindLabel[kind].toLowerCase();
  if (owner === "system") {
    return `Esta loja desligou a fonte de ${label}. Para usar uma fonte, escolha em Conexões.`;
  }
  return `A fonte de ${label} desta loja é ${connectorOf(owner).label}. Para usar outra fonte, troque em Conexões.`;
}
