import type { DataSourceState } from "../connections/connections.types";
import { providesKind } from "../connectors/connectorCatalog";
import type { ConnectorKey } from "../connectors/connectorCatalog";
import type { DataKind } from "../connectors/dataKinds";
import type { MarketingScreen } from "./marketing.types";
import type { MarketingTab } from "./marketingSchema";

export type SourceStamp = { name: string; text: string; stale: boolean };

export type MarketingPayload = MarketingScreen & { sources: SourceStamp[] };

const tabKinds: Record<MarketingTab, readonly DataKind[]> = {
  geral: ["sales", "ad_spend", "traffic"],
  meta: ["ad_spend"],
  google: ["ad_spend"],
  site: ["traffic"],
  canais: ["sales", "traffic", "ad_spend"],
  funil: ["ad_spend", "sales"],
  visao: ["sales", "ad_spend", "traffic", "social"],
  resumo: ["sales", "ad_spend", "traffic"],
  campanhas: ["ad_spend"],
  descontos: ["sales"],
  regioes: ["sales", "ad_spend"],
  social: ["social"],
};

const tabConnector: Partial<Record<MarketingTab, ConnectorKey>> = {
  meta: "meta_ads",
  google: "google_ads",
};

export function tabSources(tab: MarketingTab, sources: readonly DataSourceState[]): SourceStamp[] {
  const only = tabConnector[tab];
  return sources
    .filter((s) => s.status !== "NOT_CONNECTED")
    .filter((s) =>
      only
        ? s.connectorKey === only
        : tabKinds[tab].some((kind) => providesKind(s.connectorKey, kind)),
    )
    .map((s) => ({
      name: s.name,
      text: s.syncLabel === "—" ? s.name : `${s.name} ${s.syncLabel}`,
      stale: s.status === "ERROR",
    }));
}
