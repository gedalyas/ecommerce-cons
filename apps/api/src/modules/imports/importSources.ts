import type { ConnectorKey } from "@ecommerce/contracts/connectors";
import type { ImportKind } from "@ecommerce/contracts/imports";
import type { AdPlatform } from "@ecommerce/database/enums";

export const manualConnector: ConnectorKey = "manual_csv";

export const adPlatformConnector: Record<AdPlatform, ConnectorKey> = {
  META: "meta_ads",
  GOOGLE: "google_ads",
  TIKTOK: "tiktok_ads",
};

export const connectorKeysOfKind: Record<ImportKind, ConnectorKey[]> = {
  ORDERS: [],
  AD_SPEND: Object.values(adPlatformConnector),
  TRAFFIC: ["ga4"],
  PRODUCTS: [],
};

export function sourcesStampedBy(kind: ImportKind, platforms: AdPlatform[]): ConnectorKey[] {
  if (kind === "AD_SPEND") {
    return [manualConnector, ...new Set(platforms.map((p) => adPlatformConnector[p]))];
  }
  return [manualConnector, ...connectorKeysOfKind[kind]];
}
