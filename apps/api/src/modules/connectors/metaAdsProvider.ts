import type { ConnectorAccountOption } from "@ecommerce/contracts/connectors";
import type {
  ConnectorProvider,
  Credentials,
  SyncContext,
  SyncResult,
} from "./connectorProvider.types";
import {
  adSpendRowOfMeta,
  META_INSIGHT_FIELDS,
  metaInsightId,
  type MetaInsight,
} from "./metaAdsRows";

export type MetaConfig = {
  appId: string;
  appSecret: string;
  authUrl: string;
  graphUrl: string;
  userAgent: string;
  backfillMonths: number;
};

type MetaCredentials = Credentials & { accessToken: string; expiresAt: string };

const SCOPES = "ads_read,read_insights";
const CURSOR = "adSpend";
const OVERLAP_DAYS = 3;
const CHUNK_DAYS = 31;
const RENEW_AHEAD_DAYS = 7;
const MAX_PAGES = 200;
const DEFAULT_TOKEN_DAYS = 60;

class MetaError extends Error {}

const dayOf = (date: Date) => date.toISOString().slice(0, 10);
const shiftDays = (day: string, days: number) => {
  const d = new Date(`${day}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return dayOf(d);
};

async function graph<T>(config: MetaConfig, url: URL | string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": config.userAgent },
  });
  const body = (await response.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!response.ok) {
    throw new MetaError(`Meta respondeu ${response.status}: ${body.error?.message ?? "erro"}`);
  }
  return body;
}

type TokenBody = { access_token?: string; expires_in?: number };

function credentialsOf(token: TokenBody, now: Date): MetaCredentials {
  const seconds = token.expires_in ?? DEFAULT_TOKEN_DAYS * 24 * 60 * 60;
  return {
    accessToken: token.access_token ?? "",
    expiresAt: new Date(now.getTime() + seconds * 1000).toISOString(),
  };
}

async function longLived(
  config: MetaConfig,
  shortToken: string,
  now: Date,
): Promise<MetaCredentials> {
  const url = new URL(`${config.graphUrl.replace(/\/$/, "")}/oauth/access_token`);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", config.appId);
  url.searchParams.set("client_secret", config.appSecret);
  url.searchParams.set("fb_exchange_token", shortToken);
  const token = await graph<TokenBody>(config, url);
  if (!token.access_token) throw new MetaError("Meta não devolveu o token de longa duração");
  return credentialsOf(token, now);
}

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

async function insights(
  config: MetaConfig,
  credentials: MetaCredentials,
  accountId: string,
  from: string,
  to: string,
): Promise<MetaInsight[]> {
  const first = new URL(`${config.graphUrl.replace(/\/$/, "")}/${accountId}/insights`);
  first.searchParams.set("level", "ad");
  first.searchParams.set("time_increment", "1");
  first.searchParams.set("fields", META_INSIGHT_FIELDS);
  first.searchParams.set("time_range", JSON.stringify({ since: from, until: to }));
  first.searchParams.set("limit", "500");
  first.searchParams.set("access_token", credentials.accessToken);
  const rows: MetaInsight[] = [];
  let next: string | null = first.toString();
  for (let page = 0; next && page < MAX_PAGES; page += 1) {
    const body: { data?: MetaInsight[]; paging?: { next?: string } } = await graph(config, next);
    rows.push(...(body.data ?? []));
    next = body.paging?.next ?? null;
  }
  return rows;
}

async function pull(config: MetaConfig, context: SyncContext, from: string): Promise<SyncResult> {
  const credentials = context.credentials as MetaCredentials;
  const accountId = (context.settings["accountId"] as string | null | undefined) ?? null;
  if (!accountId) throw new Error("Escolha a conta de anúncios nas configurações da conexão.");
  const to = dayOf(context.now);
  let written = 0;
  for (let start = from; start <= to; start = shiftDays(start, CHUNK_DAYS)) {
    const end = shiftDays(start, CHUNK_DAYS - 1) < to ? shiftDays(start, CHUNK_DAYS - 1) : to;
    const rows = await insights(config, credentials, accountId, start, end);
    await context.saveRaw(
      "ad_insight",
      rows.map((r, i) => ({ externalId: metaInsightId(r, i), payload: r })),
    );
    written += await context.writeAdSpend(rows.map(adSpendRowOfMeta).filter((r) => r !== null));
  }
  return { cursor: { ...context.cursor, [CURSOR]: to }, written };
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
      const url = new URL(`${config.graphUrl.replace(/\/$/, "")}/oauth/access_token`);
      url.searchParams.set("client_id", config.appId);
      url.searchParams.set("client_secret", config.appSecret);
      url.searchParams.set("redirect_uri", redirectUri);
      url.searchParams.set("code", code);
      const short = await graph<TokenBody>(config, url);
      if (!short.access_token) throw new MetaError("Meta não devolveu o token");
      const credentials = await longLived(config, short.access_token, new Date());
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
      return longLived(config, credentials.accessToken, now);
    },
    describeSettings: async (credentials) => ({
      accounts: await adAccounts(config, credentials as MetaCredentials),
    }),
    backfill: (context) => pull(config, context, monthsAgo(context.now, config.backfillMonths)),
    sync(context) {
      const last = context.cursor[CURSOR];
      return pull(config, context, last ? shiftDays(last, -OVERLAP_DAYS) : dayOf(context.now));
    },
  };
}
