import type { ConnectorKey } from "@ecommerce/contracts/connectors";
import type { Env } from "@/shared/config/env";
import { blingProvider } from "./blingProvider";
import type { ConnectorProvider, ProviderRegistry } from "./connectorProvider.types";
import { ga4Provider } from "./ga4Provider";
import { googleAdsProvider } from "./googleAdsProvider";
import { metaAdsProvider } from "./metaAdsProvider";
import { nuvemshopProvider } from "./nuvemshopProvider";
import { shopifyProvider } from "./shopifyProvider";
import { tiktokAdsProvider } from "./tiktokAdsProvider";

function nuvemshopOf(env: Env): ConnectorProvider[] {
  if (!env.NUVEMSHOP_APP_ID || !env.NUVEMSHOP_CLIENT_SECRET) return [];
  return [
    nuvemshopProvider({
      appId: env.NUVEMSHOP_APP_ID,
      clientSecret: env.NUVEMSHOP_CLIENT_SECRET,
      authUrl: env.NUVEMSHOP_AUTH_URL,
      apiUrl: env.NUVEMSHOP_API_URL,
      userAgent: env.CONNECTOR_USER_AGENT,
      backfillMonths: env.CONNECTOR_BACKFILL_MONTHS,
    }),
  ];
}

function blingOf(env: Env): ConnectorProvider[] {
  if (!env.BLING_CLIENT_ID || !env.BLING_CLIENT_SECRET) return [];
  return [
    blingProvider({
      clientId: env.BLING_CLIENT_ID,
      clientSecret: env.BLING_CLIENT_SECRET,
      authUrl: env.BLING_AUTH_URL,
      apiUrl: env.BLING_API_URL,
      userAgent: env.CONNECTOR_USER_AGENT,
      backfillMonths: env.CONNECTOR_BACKFILL_MONTHS,
      minIntervalMs: env.BLING_MIN_INTERVAL_MS,
    }),
  ];
}

function googleOf(env: Env): ConnectorProvider[] {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return [];
  const google = {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    authUrl: env.GOOGLE_AUTH_URL,
    tokenUrl: env.GOOGLE_TOKEN_URL,
    userAgent: env.CONNECTOR_USER_AGENT,
    backfillMonths: env.CONNECTOR_BACKFILL_MONTHS,
  };
  return [
    googleAdsProvider({
      ...google,
      apiUrl: env.GOOGLE_ADS_API_URL,
      developerToken: env.GOOGLE_ADS_DEVELOPER_TOKEN,
      loginCustomerId: env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
    }),
    ga4Provider({
      ...google,
      dataApiUrl: env.GA4_DATA_API_URL,
      adminApiUrl: env.GA4_ADMIN_API_URL,
    }),
  ];
}

function metaOf(env: Env): ConnectorProvider[] {
  if (!env.META_APP_ID || !env.META_APP_SECRET) return [];
  return [
    metaAdsProvider({
      appId: env.META_APP_ID,
      appSecret: env.META_APP_SECRET,
      authUrl: env.META_AUTH_URL,
      graphUrl: env.META_GRAPH_URL,
      userAgent: env.CONNECTOR_USER_AGENT,
      backfillMonths: env.CONNECTOR_BACKFILL_MONTHS,
    }),
  ];
}

function shopifyOf(env: Env): ConnectorProvider[] {
  if (!env.SHOPIFY_CLIENT_ID || !env.SHOPIFY_CLIENT_SECRET) return [];
  return [
    shopifyProvider({
      clientId: env.SHOPIFY_CLIENT_ID,
      clientSecret: env.SHOPIFY_CLIENT_SECRET,
      scopes: env.SHOPIFY_SCOPES,
      apiVersion: env.SHOPIFY_API_VERSION,
      userAgent: env.CONNECTOR_USER_AGENT,
      backfillMonths: env.CONNECTOR_BACKFILL_MONTHS,
      shopBaseUrl: env.SHOPIFY_SHOP_BASE_URL || null,
    }),
  ];
}

function tiktokOf(env: Env): ConnectorProvider[] {
  if (!env.TIKTOK_APP_ID || !env.TIKTOK_APP_SECRET) return [];
  return [
    tiktokAdsProvider({
      appId: env.TIKTOK_APP_ID,
      secret: env.TIKTOK_APP_SECRET,
      authUrl: env.TIKTOK_AUTH_URL,
      apiUrl: env.TIKTOK_API_URL,
      userAgent: env.CONNECTOR_USER_AGENT,
      backfillMonths: env.CONNECTOR_BACKFILL_MONTHS,
    }),
  ];
}

export function providersOf(env: Env): ProviderRegistry {
  const providers = [
    ...nuvemshopOf(env),
    ...blingOf(env),
    ...googleOf(env),
    ...metaOf(env),
    ...shopifyOf(env),
    ...tiktokOf(env),
  ];
  return new Map<ConnectorKey, ConnectorProvider>(providers.map((p) => [p.key, p]));
}
