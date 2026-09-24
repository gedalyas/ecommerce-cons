import { Prisma, prismaClient } from "@ecommerce/database/client";
import type { AdPlatform } from "@ecommerce/database/enums";
import type { AdLevel } from "@ecommerce/contracts/marketing";
import { isoDay, type truncUnit, type Window } from "@ecommerce/contracts/shared/periodWindow";
import { paidMediums, trafficSourcesOf, type AdDepthSums } from "./adDepth";

export type DepthScope = {
  platform: AdPlatform;
  account: string;
  campaign: string | null;
  adset: string | null;
};

const counters = Prisma.sql`
  coalesce(sum(a.spend), 0)::float8 as spend,
  coalesce(sum(a.platform_fee), 0)::float8 as platform_fee,
  coalesce(sum(a.impressions), 0)::int as impressions,
  coalesce(sum(a.eligible_impressions), 0)::int as eligible_impressions,
  coalesce(sum(a.reach), 0)::int as reach,
  coalesce(sum(a.clicks), 0)::int as clicks,
  coalesce(sum(a.link_clicks), 0)::int as link_clicks,
  coalesce(sum(a.landing_page_views), 0)::int as landing_page_views,
  coalesce(sum(a.add_to_cart), 0)::int as add_to_cart,
  coalesce(sum(a.conversions), 0)::int as conversions,
  coalesce(sum(a.leads), 0)::int as leads,
  coalesce(sum(a.messages), 0)::int as messages
`;

type CounterRow = {
  spend: number;
  platform_fee: number;
  impressions: number;
  eligible_impressions: number;
  reach: number;
  clicks: number;
  link_clicks: number;
  landing_page_views: number;
  add_to_cart: number;
  conversions: number;
  leads: number;
  messages: number;
};

type TruncUnit = (typeof truncUnit)[keyof typeof truncUnit];

type LevelRow = CounterRow & {
  key: string;
  id: string;
  name: string;
  campaign_id: string;
  campaign_name: string;
  adset_id: string | null;
  adset_name: string | null;
  campaign_type: string | null;
  thumbnail_url: string | null;
};

const latest = (column: Prisma.Sql) => Prisma.sql`(array_agg(${column} order by a.date desc))[1]`;

const levelKeys: Record<AdLevel, Prisma.Sql> = {
  campanha: Prisma.sql`a.campaign_id as key, a.campaign_id as id, null as adset_id`,
  conjunto: Prisma.sql`a.campaign_id || '|' || a.adset_id as key, a.adset_id as id, a.adset_id`,
  anuncio: Prisma.sql`a.campaign_id || '|' || a.adset_id || '|' || a.ad_id as key, a.ad_id as id, a.adset_id`,
};

const levelGroups: Record<AdLevel, Prisma.Sql> = {
  campanha: Prisma.sql`a.campaign_id`,
  conjunto: Prisma.sql`a.campaign_id, a.adset_id`,
  anuncio: Prisma.sql`a.campaign_id, a.adset_id, a.ad_id`,
};

const levelNames: Record<AdLevel, Prisma.Sql> = {
  campanha: latest(Prisma.sql`a.campaign_name`),
  conjunto: latest(Prisma.sql`a.adset_name`),
  anuncio: latest(Prisma.sql`a.ad_name`),
};

function whereOf(clientId: string, w: Window, scope: DepthScope) {
  return Prisma.sql`
    a.client_id = ${clientId} and a.date >= ${w.start} and a.date < ${w.end}
    and a.platform = ${scope.platform}::ad_platform
    ${scope.account === "todas" ? Prisma.empty : Prisma.sql`and a.account_id = ${scope.account}`}
    ${scope.campaign ? Prisma.sql`and a.campaign_id = ${scope.campaign}` : Prisma.empty}
    ${scope.adset ? Prisma.sql`and a.adset_id = ${scope.adset}` : Prisma.empty}
  `;
}

const toSums = (r: LevelRow): AdDepthSums => ({
  key: r.key,
  id: r.id,
  name: r.name,
  campaignId: r.campaign_id,
  campaignName: r.campaign_name,
  adsetId: r.adset_id,
  adsetName: r.adset_name,
  campaignType: r.campaign_type,
  thumbnailUrl: r.thumbnail_url,
  spend: r.spend,
  platformFee: r.platform_fee,
  impressions: r.impressions,
  eligibleImpressions: r.eligible_impressions,
  reach: r.reach,
  clicks: r.clicks,
  linkClicks: r.link_clicks,
  landingPageViews: r.landing_page_views,
  addToCart: r.add_to_cart,
  conversions: r.conversions,
  leads: r.leads,
  messages: r.messages,
});

export async function depthByLevel(
  clientId: string,
  w: Window,
  level: AdLevel,
  scope: DepthScope,
): Promise<AdDepthSums[]> {
  const rows = await prismaClient.$queryRaw<LevelRow[]>`
    select ${levelKeys[level]}, ${levelNames[level]} as name, a.campaign_id,
      ${latest(Prisma.sql`a.campaign_name`)} as campaign_name,
      ${level === "anuncio" ? latest(Prisma.sql`a.adset_name`) : Prisma.sql`null`} as adset_name,
      max(a.campaign_type) as campaign_type, max(a.thumbnail_url) as thumbnail_url, ${counters}
    from ad_spend_daily a
    where ${whereOf(clientId, w, scope)}
    group by ${levelGroups[level]}
    order by spend desc, key
  `;
  return rows.map(toSums);
}

export async function depthByBucket(
  clientId: string,
  w: Window,
  unit: TruncUnit,
  scope: DepthScope,
): Promise<{ bucket: string; spend: number; conversions: number }[]> {
  const rows = await prismaClient.$queryRaw<{ bucket: Date; spend: number; conversions: number }[]>`
    select date_trunc(${unit}, a.date::timestamp) as bucket,
      coalesce(sum(a.spend), 0)::float8 as spend, coalesce(sum(a.conversions), 0)::int as conversions
    from ad_spend_daily a
    where ${whereOf(clientId, w, scope)}
    group by 1
    order by 1
  `;
  return rows.map((r) => ({
    bucket: isoDay(r.bucket),
    spend: r.spend,
    conversions: r.conversions,
  }));
}

export async function adAccounts(
  clientId: string,
  platform: AdPlatform,
  w: Window,
): Promise<{ id: string; name: string }[]> {
  const rows = await prismaClient.$queryRaw<{ id: string; name: string }[]>`
    select account_id as id, max(account_name) as name
    from ad_spend_daily
    where client_id = ${clientId} and platform = ${platform}::ad_platform and account_id <> ''
      and date >= ${w.start} and date < ${w.end}
    group by 1
    order by 2
  `;
  return rows;
}

export async function platformSessionsByBucket(
  clientId: string,
  w: Window,
  unit: TruncUnit,
  platform: AdPlatform,
): Promise<{ bucket: string; sessions: number }[]> {
  const rows = await prismaClient.$queryRaw<{ bucket: Date; sessions: number }[]>`
    select date_trunc(${unit}, t.date::timestamp) as bucket, coalesce(sum(t.sessions), 0)::int as sessions
    from traffic_daily t
    where t.client_id = ${clientId} and t.date >= ${w.start} and t.date < ${w.end}
      and lower(t.source) in (${Prisma.join(trafficSourcesOf(platform))})
      and lower(t.medium) in (${Prisma.join(paidMediums)})
    group by 1
    order by 1
  `;
  return rows.map((r) => ({ bucket: isoDay(r.bucket), sessions: r.sessions }));
}

export async function platformSessionsTotal(
  clientId: string,
  w: Window,
  platform: AdPlatform,
): Promise<number> {
  const [row] = await prismaClient.$queryRaw<{ sessions: number }[]>`
    select coalesce(sum(t.sessions), 0)::int as sessions
    from traffic_daily t
    where t.client_id = ${clientId} and t.date >= ${w.start} and t.date < ${w.end}
      and lower(t.source) in (${Prisma.join(trafficSourcesOf(platform))})
      and lower(t.medium) in (${Prisma.join(paidMediums)})
  `;
  return row?.sessions ?? 0;
}
