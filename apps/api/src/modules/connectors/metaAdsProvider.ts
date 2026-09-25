import type { ConnectorAccountOption } from "@ecommerce/contracts/connectors";
import type { ConnectorProvider, SyncContext, SyncResult } from "./connectorProvider.types";
import {
  accountOptions,
  accountsToSync,
  adSpendRowOfMeta,
  META_INSIGHT_FIELDS,
  metaInsightId,
  type MetaInsight,
} from "./metaAdsRows";
import { exchangeMetaCode, graph, longLivedMetaToken, type MetaCredentials } from "./metaGraph";

export type MetaConfig = {
  appId: string;
  appSecret: string;
  authUrl: string;
  graphUrl: string;
  userAgent: string;
  backfillMonths: number;
};

const SCOPES = "ads_read,read_insights";
const CURSOR = "adSpend";
const OVERLAP_DAYS = 3;
const CHUNK_DAYS = 31;
const RENEW_AHEAD_DAYS = 7;
const MAX_PAGES = 200;

const dayOf = (date: Date) => date.toISOString().slice(0, 10);
const shiftDays = (day: string, days: number) => {
  const d = new Date(`${day}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return dayOf(d);
};

async function adAccounts(
  config: MetaConfig,
  credentials: MetaCredentials,
): Promise<ConnectorAccountOption[]> {
  const url = new URL(`${config.graphUrl.replace(/\/$/, "")}/me/adaccounts`);
  url.searchParams.set("fields", "id,name,account_id");
  url.searchParams.set("access_token", credentials.accessToken);
  const body = await graph<{ data?: { id?: string; name?: string; account_id?: string }[] }>(
    config,
    url,
  );
  return (body.data ?? []).flatMap((a) => {
    const id = a.id ?? (a.account_id ? `act_${a.account_id}` : null);
    return id ? [{ id, label: a.name ? `${a.name} (${id})` : id }] : [];
  });
}

async function pages<T>(config: MetaConfig, first: URL): Promise<T[]> {
  const rows: T[] = [];
  const origin = first.origin;
  let next: string | null = first.toString();
  for (let page = 0; next && new URL(next).origin === origin && page < MAX_PAGES; page += 1) {
    const body: { data?: T[]; paging?: { next?: string } } = await graph(config, next);
    rows.push(...(body.data ?? []));
    next = body.paging?.next ?? null;
  }
  return rows;
}

function accountUrl(config: MetaConfig, credentials: MetaCredentials, path: string): URL {
  const url = new URL(`${config.graphUrl.replace(/\/$/, "")}/${path}`);
  url.searchParams.set("limit", "500");
  url.searchParams.set("access_token", credentials.accessToken);
  return url;
}

function insights(
  config: MetaConfig,
  credentials: MetaCredentials,
  accountId: string,
  range: { from: string; to: string },
): Promise<MetaInsight[]> {
  const url = accountUrl(config, credentials, `${accountId}/insights`);
  url.searchParams.set("level", "ad");
  url.searchParams.set("time_increment", "1");
  url.searchParams.set("fields", META_INSIGHT_FIELDS);
  url.searchParams.set("time_range", JSON.stringify({ since: range.from, until: range.to }));
  return pages<MetaInsight>(config, url);
}

async function thumbnails(
  config: MetaConfig,
  credentials: MetaCredentials,
  accountId: string,
): Promise<Map<string, string>> {
  const url = accountUrl(config, credentials, `${accountId}/ads`);
  url.searchParams.set("fields", "id,creative{thumbnail_url}");
  const ads = await pages<{ id?: string; creative?: { thumbnail_url?: string } }>(config, url);
  return new Map(
    ads.flatMap((ad) =>
      ad.id && ad.creative?.thumbnail_url ? [[ad.id, ad.creative.thumbnail_url] as const] : [],
    ),
  );
}

async function pullAccount(
  config: MetaConfig,
  context: SyncContext,
  accountId: string,
  from: string,
): Promise<number> {
  const credentials = context.credentials as MetaCredentials;
  const to = dayOf(context.now);
  const rowContext = { accountId, thumbnails: await thumbnails(config, credentials, accountId) };
  let written = 0;
  for (let start = from; start <= to; start = shiftDays(start, CHUNK_DAYS)) {
    const end = shiftDays(start, CHUNK_DAYS - 1) < to ? shiftDays(start, CHUNK_DAYS - 1) : to;
    const rows = await insights(config, credentials, accountId, { from: start, to: end });
    await context.saveRaw(
      "ad_insight",
      rows.map((r, i) => ({ externalId: `${accountId}:${metaInsightId(r, i)}`, payload: r })),
    );
    written += await context.writeAdSpend(
      rows.map((r, i) => adSpendRowOfMeta(r, i, rowContext)).filter((r) => r !== null),
    );
  }
  return written;
}

async function pull(config: MetaConfig, context: SyncContext, from: string): Promise<SyncResult> {
  const selected = (context.settings["accountId"] as string | null | undefined) ?? null;
  if (!selected) throw new Error("Escolha a conta de anúncios nas configurações da conexão.");
  const available = (await adAccounts(config, context.credentials as MetaCredentials)).map(
    (a) => a.id,
  );
  let written = 0;
  for (const accountId of accountsToSync(selected, available)) {
    written += await pullAccount(config, context, accountId, from);
  }
  return { cursor: { ...context.cursor, [CURSOR]: dayOf(context.now) }, written };
}

const monthsAgo = (now: Date, months: number) => {
  const d = new Date(now);
  d.setUTCMonth(d.getUTCMonth() - months);
  return dayOf(d);
};

export function metaAdsProvider(config: MetaConfig): ConnectorProvider {
  return {
    key: "meta_ads",
    authPattern: "oauth",
    authorizeUrl: ({ state, redirectUri }) => {
      const url = new URL(config.authUrl);
      url.searchParams.set("client_id", config.appId);
      url.searchParams.set("redirect_uri", redirectUri);
      url.searchParams.set("state", state);
      url.searchParams.set("scope", SCOPES);
      url.searchParams.set("response_type", "code");
      return url.toString();
    },
    async exchangeCode({ code, redirectUri }) {
      const short = await exchangeMetaCode(config, code, redirectUri);
      const credentials = await longLivedMetaToken(config, short, new Date());
      const accounts = await adAccounts(config, credentials);
      const first = accounts[0];
      return {
        credentials,
        externalId: first?.id ?? "meta",
        externalLabel: first ? `Meta Ads · ${first.label}` : "Meta Ads",
        settings: { accountId: accounts.length === 1 ? (first?.id ?? null) : null },
      };
    },
    async refresh(stored, now) {
      const credentials = stored as MetaCredentials;
      const daysLeft = (new Date(credentials.expiresAt).getTime() - now.getTime()) / 86_400_000;
      if (daysLeft > RENEW_AHEAD_DAYS) return null;
      return longLivedMetaToken(config, credentials.accessToken, now);
    },
    describeSettings: async (credentials) => ({
      accounts: accountOptions(await adAccounts(config, credentials as MetaCredentials)),
    }),
    backfill: (context) => pull(config, context, monthsAgo(context.now, config.backfillMonths)),
    sync(context) {
      const last = context.cursor[CURSOR];
      return pull(config, context, last ? shiftDays(last, -OVERLAP_DAYS) : dayOf(context.now));
    },
  };
}
