import type { StoreConnector } from "@ecommerce/contracts/connectors";

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
