import type { ConnectorSettings, StoreConnector } from "@ecommerce/contracts/connectors";

type CardState = "connected" | "error" | "manual" | null;

type Stated = Pick<StoreConnector, "kind" | "status" | "connection">;

export function cardStateOf(connector: Stated): CardState {
  if (connector.status === "ERROR" || connector.connection?.stage === "ERROR") return "error";
  if (connector.connection || connector.status === "CONNECTED") return "connected";
  if (connector.status === "MANUAL" && connector.kind !== "manual") return "manual";
  return null;
}

export const isStoreIntegration = (connector: Stated): boolean =>
  connector.kind !== "manual" && cardStateOf(connector) !== null;

type SettingsDraft = Pick<ConnectorSettings, "statusMap" | "accountId">;

export function settingsChanged(saved: ConnectorSettings, draft: SettingsDraft): boolean {
  if (draft.accountId !== saved.accountId) return true;
  const ids = new Set([...Object.keys(saved.statusMap), ...Object.keys(draft.statusMap)]);
  return [...ids].some((id) => saved.statusMap[id] !== draft.statusMap[id]);
}

export function nextActive(current: number, step: 1 | -1, count: number): number {
  if (count === 0) return -1;
  if (current < 0) return step === 1 ? 0 : count - 1;
  return (current + step + count) % count;
}
