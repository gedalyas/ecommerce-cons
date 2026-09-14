import type { ConnectorAccountOption } from "@ecommerce/contracts/connectors";
import type { SocialPostInput } from "@/modules/imports/contract";
import type { ConnectorProvider, SyncContext, SyncResult } from "./connectorProvider.types";
import {
  daysBetween,
  FACEBOOK_PAGE_METRICS,
  FACEBOOK_POST_FIELDS,
  facebookDailyOf,
  facebookPostOf,
  INSTAGRAM_ACCOUNT_METRICS,
  INSTAGRAM_MEDIA_FIELDS,
  instagramDailyOf,
  instagramPostOf,
  type FacebookPost,
  type GraphInsight,
  type InstagramMedia,
} from "./instagramRows";
import {
  exchangeMetaCode,
  graph,
  graphUrlOf,
  longLivedMetaToken,
  MetaError,
  type MetaCredentials,
  type MetaGraphConfig,
} from "./metaGraph";

export type InstagramConfig = MetaGraphConfig & {
  authUrl: string;
  backfillMonths: number;
};

type Page = {
  id: string;
  name?: string | null;
  access_token?: string | null;
  instagram_business_account?: { id?: string | null; username?: string | null } | null;
};

const SCOPES =
  "pages_show_list,pages_read_engagement,read_insights,instagram_basic,instagram_manage_insights";
const CURSOR = "social";
const CHUNK_DAYS = 30;
const OVERLAP_DAYS = 3;
const RENEW_AHEAD_DAYS = 7;
const MAX_PAGES = 100;
const MEDIA_LIMIT = 50;

const dayOf = (date: Date) => date.toISOString().slice(0, 10);
const shiftDays = (day: string, days: number) => {
  const d = new Date(`${day}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return dayOf(d);
};
const unixOf = (day: string) =>
  String(Math.floor(new Date(`${day}T00:00:00.000Z`).getTime() / 1000));

async function pages(config: InstagramConfig, credentials: MetaCredentials): Promise<Page[]> {
  const url = graphUrlOf(config, "me/accounts");
  url.searchParams.set("fields", "id,name,access_token,instagram_business_account{id,username}");
  url.searchParams.set("access_token", credentials.accessToken);
  return (await graph<{ data?: Page[] }>(config, url)).data ?? [];
}

const accountOptionOf = (page: Page): ConnectorAccountOption => {
  const ig = page.instagram_business_account?.username;
  return { id: page.id, label: ig ? `${page.name ?? page.id} · @${ig}` : (page.name ?? page.id) };
};

async function pageOf(
  config: InstagramConfig,
  credentials: MetaCredentials,
  pageId: string,
): Promise<Page> {
  const page = (await pages(config, credentials)).find((p) => p.id === pageId);
  if (!page?.access_token) throw new MetaError("A Página escolhida não está mais acessível");
  return page;
}

async function collect<T>(config: InstagramConfig, first: URL): Promise<T[]> {
  const rows: T[] = [];
  let next: string | null = first.toString();
  for (let page = 0; next && page < MAX_PAGES; page += 1) {
    const body: { data?: T[]; paging?: { next?: string } } = await graph(config, next);
    rows.push(...(body.data ?? []));
    next = body.paging?.next ?? null;
  }
  return rows;
}

type Range = { from: string; to: string };

async function accountInsights(
  config: InstagramConfig,
  token: string,
  id: string,
  metrics: string,
  range: Range,
): Promise<GraphInsight[]> {
  const url = graphUrlOf(config, `${id}/insights`);
  url.searchParams.set("metric", metrics);
  url.searchParams.set("period", "day");
  url.searchParams.set("since", unixOf(range.from));
  url.searchParams.set("until", unixOf(shiftDays(range.to, 1)));
  url.searchParams.set("access_token", token);
  return (await graph<{ data?: GraphInsight[] }>(config, url)).data ?? [];
}

async function instagramChunk(
  config: InstagramConfig,
  page: Page,
  from: string,
  to: string,
): Promise<{ daily: ReturnType<typeof instagramDailyOf>; posts: SocialPostInput[] }> {
  const igId = page.instagram_business_account?.id;
  const token = page.access_token ?? "";
  if (!igId) return { daily: [], posts: [] };
  const profile = graphUrlOf(config, igId);
  profile.searchParams.set("fields", "followers_count");
  profile.searchParams.set("access_token", token);
  const media = graphUrlOf(config, `${igId}/media`);
  media.searchParams.set("fields", INSTAGRAM_MEDIA_FIELDS);
  media.searchParams.set("since", unixOf(from));
  media.searchParams.set("until", unixOf(shiftDays(to, 1)));
  media.searchParams.set("limit", String(MEDIA_LIMIT));
  media.searchParams.set("access_token", token);
  const [account, insights, items] = await Promise.all([
    graph<{ followers_count?: number }>(config, profile),
    accountInsights(config, token, igId, INSTAGRAM_ACCOUNT_METRICS, { from, to }),
    collect<InstagramMedia>(config, media),
  ]);
  const posts = items.map((m) => instagramPostOf(igId, m)).filter((p) => p !== null);
  const daily = instagramDailyOf(
    igId,
    insights,
    account.followers_count ?? 0,
    posts,
    daysBetween(from, to),
  );
  return { daily, posts };
}

async function facebookChunk(
  config: InstagramConfig,
  page: Page,
  from: string,
  to: string,
): Promise<{ daily: ReturnType<typeof facebookDailyOf>; posts: SocialPostInput[] }> {
  const token = page.access_token ?? "";
  const feed = graphUrlOf(config, `${page.id}/posts`);
  feed.searchParams.set("fields", FACEBOOK_POST_FIELDS);
  feed.searchParams.set("since", unixOf(from));
  feed.searchParams.set("until", unixOf(shiftDays(to, 1)));
  feed.searchParams.set("limit", String(MEDIA_LIMIT));
  feed.searchParams.set("access_token", token);
  const [insights, items] = await Promise.all([
    accountInsights(config, token, page.id, FACEBOOK_PAGE_METRICS, { from, to }),
    collect<FacebookPost>(config, feed),
  ]);
  const posts = items.map((p) => facebookPostOf(page.id, p)).filter((p) => p !== null);
  return { daily: facebookDailyOf(page.id, insights, posts, daysBetween(from, to)), posts };
}

async function pull(
  config: InstagramConfig,
  context: SyncContext,
  from: string,
): Promise<SyncResult> {
  const credentials = context.credentials as MetaCredentials;
  const pageId = (context.settings["accountId"] as string | null | undefined) ?? null;
  if (!pageId) throw new MetaError("Escolha a Página do Facebook nas configurações da conexão.");
  const page = await pageOf(config, credentials, pageId);
  const to = dayOf(context.now);
  let written = 0;
  for (let start = from; start <= to; start = shiftDays(start, CHUNK_DAYS)) {
    const end = shiftDays(start, CHUNK_DAYS - 1) < to ? shiftDays(start, CHUNK_DAYS - 1) : to;
    const [ig, fb] = await Promise.all([
      instagramChunk(config, page, start, end),
      facebookChunk(config, page, start, end),
    ]);
    const posts = [...ig.posts, ...fb.posts];
    await context.saveRaw(
      "social",
      posts.map((p) => ({ externalId: `${p.platform}:${p.externalId}`, payload: p })),
    );
    written += await context.writeSocial({ daily: [...ig.daily, ...fb.daily], posts });
  }
  return { cursor: { ...context.cursor, [CURSOR]: to }, written };
}

const monthsAgo = (now: Date, months: number) => {
  const d = new Date(now);
  d.setUTCMonth(d.getUTCMonth() - months);
  return dayOf(d);
};

export function instagramProvider(config: InstagramConfig): ConnectorProvider {
  return {
    key: "instagram",
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
      const options = (await pages(config, credentials)).map(accountOptionOf);
      const first = options[0];
      return {
        credentials,
        externalId: first?.id ?? "instagram",
        externalLabel: first ? first.label : "Instagram e Facebook",
        settings: { accountId: options.length === 1 ? (first?.id ?? null) : null },
      };
    },
    async refresh(stored, now) {
      const credentials = stored as MetaCredentials;
      const daysLeft = (new Date(credentials.expiresAt).getTime() - now.getTime()) / 86_400_000;
      if (daysLeft > RENEW_AHEAD_DAYS) return null;
      return longLivedMetaToken(config, credentials.accessToken, now);
    },
    describeSettings: async (credentials) => ({
      accounts: (await pages(config, credentials as MetaCredentials)).map(accountOptionOf),
    }),
    backfill: (context) => pull(config, context, monthsAgo(context.now, config.backfillMonths)),
    sync(context) {
      const last = context.cursor[CURSOR];
      return pull(config, context, last ? shiftDays(last, -OVERLAP_DAYS) : dayOf(context.now));
    },
  };
}
