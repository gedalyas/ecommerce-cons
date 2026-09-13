import type { ConnectorKey } from "@ecommerce/contracts/connectors";
import type { Env } from "@/shared/config/env";
import type { ConnectorProvider, ProviderRegistry } from "./connectorProvider.types";
import { blingProvider } from "./blingProvider";
import { nuvemshopProvider } from "./nuvemshopProvider";

export function providersOf(env: Env): ProviderRegistry {
  const providers: ConnectorProvider[] = [];
  if (env.NUVEMSHOP_APP_ID && env.NUVEMSHOP_CLIENT_SECRET) {
    providers.push(
      nuvemshopProvider({
        appId: env.NUVEMSHOP_APP_ID,
        clientSecret: env.NUVEMSHOP_CLIENT_SECRET,
        authUrl: env.NUVEMSHOP_AUTH_URL,
        apiUrl: env.NUVEMSHOP_API_URL,
        userAgent: env.CONNECTOR_USER_AGENT,
        backfillMonths: env.CONNECTOR_BACKFILL_MONTHS,
      }),
    );
  }
  if (env.BLING_CLIENT_ID && env.BLING_CLIENT_SECRET) {
    providers.push(
      blingProvider({
        clientId: env.BLING_CLIENT_ID,
        clientSecret: env.BLING_CLIENT_SECRET,
        authUrl: env.BLING_AUTH_URL,
        apiUrl: env.BLING_API_URL,
        userAgent: env.CONNECTOR_USER_AGENT,
        backfillMonths: env.CONNECTOR_BACKFILL_MONTHS,
        minIntervalMs: env.BLING_MIN_INTERVAL_MS,
      }),
    );
  }
  return new Map<ConnectorKey, ConnectorProvider>(providers.map((p) => [p.key, p]));
}
