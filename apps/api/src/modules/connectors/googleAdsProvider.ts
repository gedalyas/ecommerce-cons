import type { ConnectorAccountOption } from "@ecommerce/contracts/connectors";
import type { ConnectorProvider, SyncContext, SyncResult } from "./connectorProvider.types";
import {
  GOOGLE_ADS_SCOPE,
  googleAuthorizeUrl,
  googleExchangeCode,
  googleJson,
  googleRefresh,
  type GoogleConfig,
  type GoogleCredentials,
} from "./googleAuth";
import {
  adSpendRowOfGoogle,
  adsQuery,
  customerIdOf,
  type GoogleAdsResultRow,
} from "./googleAdsRows";

export type GoogleAdsConfig = GoogleConfig & {
  apiUrl: string;
  developerToken: string;
  loginCustomerId: string;
  backfillMonths: number;
};

const CURSOR = "adSpend";
const OVERLAP_DAYS = 3;
const CHUNK_DAYS = 31;

const dayOf = (date: Date) => date.toISOString().slice(0, 10);
const shiftDays = (day: string, days: number) => {
  const d = new Date(`${day}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return dayOf(d);
};

function headersOf(config: GoogleAdsConfig): Record<string, string> {
  return {
    ...(config.developerToken ? { "developer-token": config.developerToken } : {}),
    ...(config.loginCustomerId ? { "login-customer-id": config.loginCustomerId } : {}),
  };
}

async function accessibleCustomers(
  config: GoogleAdsConfig,
  credentials: GoogleCredentials,
): Promise<ConnectorAccountOption[]> {
  const body = await googleJson<{ resourceNames?: string[] }>(
    `${config.apiUrl.replace(/\/$/, "")}/customers:listAccessibleCustomers`,
    credentials,
    { headers: headersOf(config), userAgent: config.userAgent },
  );
  return (body.resourceNames ?? []).map((name) => ({
    id: customerIdOf(name),
    label: `Conta ${customerIdOf(name)}`,
  }));
}

async function searchStream(
  config: GoogleAdsConfig,
  credentials: GoogleCredentials,
  customerId: string,
  query: string,
): Promise<GoogleAdsResultRow[]> {
  const chunks = await googleJson<{ results?: GoogleAdsResultRow[] }[]>(
    `${config.apiUrl.replace(/\/$/, "")}/customers/${customerId}/googleAds:searchStream`,
    credentials,
    { method: "POST", headers: headersOf(config), body: { query }, userAgent: config.userAgent },
  );
  return (Array.isArray(chunks) ? chunks : [chunks]).flatMap((c) => c.results ?? []);
}

async function pull(
  config: GoogleAdsConfig,
  context: SyncContext,
  from: string,
): Promise<SyncResult> {
  const credentials = context.credentials as GoogleCredentials;
  const accountId = (context.settings["accountId"] as string | null | undefined) ?? null;
  if (!accountId) throw new Error("Escolha a conta do Google Ads nas configurações da conexão.");
  const to = dayOf(context.now);
  let written = 0;
  for (let start = from; start <= to; start = shiftDays(start, CHUNK_DAYS)) {
    const end = shiftDays(start, CHUNK_DAYS - 1) < to ? shiftDays(start, CHUNK_DAYS - 1) : to;
    const results = await searchStream(config, credentials, accountId, adsQuery(start, end));
    await context.saveRaw(
      "ad_insight",
      results.map((r, i) => ({
        externalId: `${r.segments?.date ?? start}:${r.adGroupAd?.ad?.id ?? r.campaign?.id ?? i}`,
        payload: r,
      })),
    );
    const rows = results.map(adSpendRowOfGoogle).filter((r) => r !== null);
    written += await context.writeAdSpend(rows);
  }
  return { cursor: { ...context.cursor, [CURSOR]: to }, written };
}

const monthsAgo = (now: Date, months: number) => {
  const d = new Date(now);
  d.setUTCMonth(d.getUTCMonth() - months);
  return dayOf(d);
};

export function googleAdsProvider(config: GoogleAdsConfig): ConnectorProvider {
  return {
    key: "google_ads",
    authPattern: "oauth",
    authorizeUrl: ({ state, redirectUri }) =>
      googleAuthorizeUrl(config, { state, redirectUri, scope: GOOGLE_ADS_SCOPE }),
    async exchangeCode({ code, redirectUri }) {
      const credentials = await googleExchangeCode(config, code, redirectUri, new Date());
      const accounts = await accessibleCustomers(config, credentials);
      const first = accounts[0];
      return {
        credentials,
        externalId: first?.id ?? "google-ads",
        externalLabel: first ? `Google Ads · ${first.label}` : "Google Ads",
        settings: { accountId: accounts.length === 1 ? (first?.id ?? null) : null },
      };
    },
    refresh: (credentials, now) => googleRefresh(config, credentials, now),
    describeSettings: async (credentials) => ({
      accounts: await accessibleCustomers(config, credentials as GoogleCredentials),
    }),
    backfill: (context) => pull(config, context, monthsAgo(context.now, config.backfillMonths)),
    sync(context) {
      const last = context.cursor[CURSOR];
      return pull(config, context, last ? shiftDays(last, -OVERLAP_DAYS) : dayOf(context.now));
    },
  };
}
