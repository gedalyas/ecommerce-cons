import type { Fulfillment } from "../orders/ordersLabels";
import type { ConnectorKey } from "./connectorCatalog";

type Modality = { family: ConnectorKey; fulfillment: Fulfillment | null };

const modalities: Partial<Record<ConnectorKey, Modality>> = {
  mercado_livre: { family: "mercado_livre", fulfillment: "SELLER" },
  mercado_livre_full: { family: "mercado_livre", fulfillment: "MARKETPLACE" },
  amazon: { family: "amazon", fulfillment: "SELLER" },
  amazon_fba_classic: { family: "amazon", fulfillment: "MARKETPLACE" },
  amazon_fba_onsite: { family: "amazon", fulfillment: null },
};

export const familyOf = (key: ConnectorKey): ConnectorKey => modalities[key]?.family ?? key;

export const sameFamily = (a: ConnectorKey, b: ConnectorKey): boolean =>
  familyOf(a) === familyOf(b);

const fulfillmentOfConnector = (key: ConnectorKey): Fulfillment | null =>
  modalities[key]?.fulfillment ?? null;

export function keepsOrderFor(key: ConnectorKey, order: Fulfillment | null): boolean {
  const wanted = fulfillmentOfConnector(key);
  if (wanted === null) return true;
  return wanted === "SELLER" ? order !== "MARKETPLACE" : order === "MARKETPLACE";
}
