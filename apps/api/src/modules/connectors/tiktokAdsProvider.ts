import type { ConnectorAccountOption } from "@ecommerce/contracts/connectors";
import type {
  ConnectorProvider,
  Credentials,
  SyncContext,
  SyncResult,
} from "./connectorProvider.types";
import { adSpendRowOfTiktok, TIKTOK_METRICS, type TiktokReportRow } from "./tiktokAdsRows";

export type TiktokConfig = {
  appId: string;
  secret: string;
  authUrl: string;
  apiUrl: string;
  userAgent: string;
  backfillMonths: number;
};

type TiktokCredentials = Credentials & { accessToken: string; advertiserIds: string[] };

const CURSOR = "adSpend";
const OVERLAP_DAYS = 3;
const CHUNK_DAYS = 30;
const PAGE_SIZE = 1000;
const MAX_PAGES = 200;

class TiktokError extends Error {}

const dayOf = (date: Date) => date.toISOString().slice(0, 10);
const shiftDays = (day: string, days: number) => {
  const d = new Date(`${day}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return dayOf(d);
};

type Envelope<T> = { code?: number; message?: string; data?: T };

async function call<T>(
  config: TiktokConfig,
  path: string,
  init: { method?: string; token?: string; body?: unknown; query?: Record<string, string> },
): Promise<T> {
  const url = new URL(`${config.apiUrl.replace(/\/$/, "")}${path}`);
  for (const [k, v] of Object.entries(init.query ?? {})) url.searchParams.set(k, v);
  const response = await fetch(url, {
    method: init.method ?? "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": config.userAgent,
      ...(init.token ? { "Access-Token": init.token } : {}),
      ...(init.body !== undefined ? { "content-type": "application/json" } : {}),
    },
    ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
  });
  const body = (await response.json().catch(() => ({}))) as Envelope<T>;
  if (!response.ok || (body.code !== undefined && body.code !== 0)) {
    throw new TiktokError(
      `TikTok respondeu ${body.code ?? response.status}: ${body.message ?? "erro"}`,
    );
  }
  if (body.data === undefined) throw new TiktokError("TikTok respondeu sem dados");
  return body.data;
}

const accountsOf = (ids: string[]): ConnectorAccountOption[] =>
  ids.map((id) => ({ id, label: `Anunciante ${id}` }));

async function pull(config: TiktokConfig, context: SyncContext, from: string): Promise<SyncResult> {
  const credentials = context.credentials as TiktokCredentials;
  const advertiserId = (context.settings["accountId"] as string | null | undefined) ?? null;
  if (!advertiserId) throw new Error("Escolha o anunciante nas configurações da conexão.");
  const to = dayOf(context.now);
  let written = 0;
  for (let start = from; start <= to; start = shiftDays(start, CHUNK_DAYS)) {
    const end = shiftDays(start, CHUNK_DAYS - 1) < to ? shiftDays(start, CHUNK_DAYS - 1) : to;
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const data = await call<{ list?: TiktokReportRow[]; page_info?: { total_page?: number } }>(
        config,
        "/report/integrated/get/",
        {
          token: credentials.accessToken,
          query: {
            advertiser_id: advertiserId,
            report_type: "BASIC",
            data_level: "AUCTION_AD",
            dimensions: JSON.stringify(["ad_id", "stat_time_day"]),
            metrics: JSON.stringify(TIKTOK_METRICS),
            start_date: start,
            end_date: end,
            page: String(page),
            page_size: String(PAGE_SIZE),
          },
        },
      );
      const rows = data.list ?? [];
      await context.saveRaw(
        "ad_insight",
        rows.map((r, i) => ({
          externalId: `${r.dimensions?.stat_time_day ?? start}:${r.dimensions?.ad_id ?? i}`,
          payload: r,
        })),
      );
      written += await context.writeAdSpend(rows.map(adSpendRowOfTiktok).filter((r) => r !== null));
      if (page >= (data.page_info?.total_page ?? 1)) break;
    }
  }
  return { cursor: { ...context.cursor, [CURSOR]: to }, written };
}

const monthsAgo = (now: Date, months: number) => {
  const d = new Date(now);
  d.setUTCMonth(d.getUTCMonth() - months);
  return dayOf(d);
};

export function tiktokAdsProvider(config: TiktokConfig): ConnectorProvider {
  return {
    key: "tiktok_ads",
    authPattern: "oauth",
    authorizeUrl: ({ state, redirectUri }) => {
      const url = new URL(config.authUrl);
      url.searchParams.set("app_id", config.appId);
      url.searchParams.set("state", state);
      url.searchParams.set("redirect_uri", redirectUri);
      return url.toString();
    },
    async exchangeCode({ code }) {
      const data = await call<{ access_token?: string; advertiser_ids?: (string | number)[] }>(
        config,
        "/oauth2/access_token/",
        { method: "POST", body: { app_id: config.appId, secret: config.secret, auth_code: code } },
      );
      if (!data.access_token) throw new TiktokError("TikTok não devolveu o token");
      const advertiserIds = (data.advertiser_ids ?? []).map(String);
      const first = advertiserIds[0];
      return {
        credentials: { accessToken: data.access_token, advertiserIds },
        externalId: first ?? "tiktok",
        externalLabel: first ? `TikTok Ads · ${first}` : "TikTok Ads",
        settings: { accountId: advertiserIds.length === 1 ? (first ?? null) : null },
      };
    },
    describeSettings: async (credentials) => ({
      accounts: accountsOf((credentials as TiktokCredentials).advertiserIds ?? []),
    }),
    backfill: (context) => pull(config, context, monthsAgo(context.now, config.backfillMonths)),
    sync(context) {
      const last = context.cursor[CURSOR];
      return pull(config, context, last ? shiftDays(last, -OVERLAP_DAYS) : dayOf(context.now));
    },
  };
}
