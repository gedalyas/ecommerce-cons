import { Prisma, prismaClient } from "@ecommerce/database/client";
import type { AdPlatform } from "@ecommerce/database/enums";
import { isoDay, type Window } from "@ecommerce/contracts/shared/periodWindow";
import type { AdSums } from "./marketingMetrics";
import {
  adPlatformLabel,
  type AdLevel,
  type AdPlatformFilter,
} from "@ecommerce/contracts/marketing";

const platformClause = (platform: AdPlatformFilter) =>
  platform === "todas" ? Prisma.empty : Prisma.sql`and a.platform = ${platform}::ad_platform`;

const sums = Prisma.sql`
  coalesce(sum(a.spend), 0)::float8 as spend,
  coalesce(sum(a.platform_fee), 0)::float8 as platform_fee,
  coalesce(sum(a.attributed_revenue), 0)::float8 as revenue,
  coalesce(sum(a.conversions), 0)::int as orders,
  coalesce(sum(a.impressions), 0)::int as impressions,
  coalesce(sum(a.clicks), 0)::int as clicks
`;

type SumRow = {
  spend: number;
  platform_fee: number;
  revenue: number;
  orders: number;
  impressions: number;
  clicks: number;
};

const toSums = (r: SumRow, head: Omit<AdSums, keyof SumRow | "platformFee">): AdSums => ({
  ...head,
  spend: r.spend,
  platformFee: r.platform_fee,
  revenue: r.revenue,
  orders: r.orders,
  impressions: r.impressions,
  clicks: r.clicks,
});

/** One row per platform present in the window. */
export async function adsByPlatform(clientId: string, w: Window): Promise<AdSums[]> {
  const rows = await prismaClient.$queryRaw<(SumRow & { platform: AdPlatform })[]>`
    select a.platform, ${sums}
    from ad_spend_daily a
    where a.client_id = ${clientId} and a.date >= ${w.start} and a.date < ${w.end}
    group by 1
    order by 2 desc
  `;
  return rows.map((r) =>
    toSums(r, {
      id: r.platform,
      name: adPlatformLabel[r.platform],
      platform: r.platform,
      campaignName: null,
      adsetName: null,
    }),
  );
}

/** The selected level of the hierarchy, optionally within one platform. */
export async function adsByLevel(
  clientId: string,
  w: Window,
  level: AdLevel,
  platform: AdPlatformFilter,
): Promise<AdSums[]> {
  const where = Prisma.sql`
    a.client_id = ${clientId} and a.date >= ${w.start} and a.date < ${w.end}
    ${platformClause(platform)}
  `;
  type Row = SumRow & {
    id: string;
    name: string;
    platform: AdPlatform;
    campaign_name: string;
    adset_name: string | null;
  };
  const rows =
    level === "campanha"
      ? await prismaClient.$queryRaw<Row[]>`
          select a.campaign_id as id, a.campaign_name as name, a.platform,
            a.campaign_name, null as adset_name, ${sums}
          from ad_spend_daily a where ${where}
          group by 1, 2, 3, 4
          order by spend desc
        `
      : level === "conjunto"
        ? await prismaClient.$queryRaw<Row[]>`
          select a.adset_id as id, a.adset_name as name, a.platform,
            a.campaign_name, null as adset_name, ${sums}
          from ad_spend_daily a where ${where}
          group by 1, 2, 3, 4
          order by spend desc
        `
        : await prismaClient.$queryRaw<Row[]>`
          select a.ad_id as id, a.ad_name as name, a.platform,
            a.campaign_name, a.adset_name, ${sums}
          from ad_spend_daily a where ${where}
          group by 1, 2, 3, 4, 5
          order by spend desc
        `;
  return rows.map((r) =>
    toSums(r, {
      id: r.id,
      name: r.name,
      platform: r.platform,
      campaignName: r.campaign_name,
      adsetName: r.adset_name,
    }),
  );
}

export type PlatformBucket = SumRow & { platform: AdPlatform; bucket: string };

/** Sums per platform and bucket, for the platform lines of the campaigns chart. */
export async function adsByPlatformBucket(
  clientId: string,
  w: Window,
  unit: string,
): Promise<PlatformBucket[]> {
  const rows = await prismaClient.$queryRaw<(SumRow & { platform: AdPlatform; bucket: Date })[]>`
    select a.platform, date_trunc(${unit}, a.date) as bucket, ${sums}
    from ad_spend_daily a
    where a.client_id = ${clientId} and a.date >= ${w.start} and a.date < ${w.end}
    group by 1, 2
    order by 1, 2
  `;
  return rows.map((r) => ({ ...r, bucket: isoDay(r.bucket) }));
}
