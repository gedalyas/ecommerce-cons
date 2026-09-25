import { Prisma, prismaClient } from "@ecommerce/database/client";
import { ordersByBucket, marketplaceChannels } from "@/modules/orders/contract";
import {
  salesChannelOptions,
  siteChannel,
  type AdPlatform,
  type MarketingInvestmentFunnel,
  type StageKey,
} from "@ecommerce/contracts/marketing";
import type { PeriodSearch } from "@ecommerce/contracts/shared/period";
import {
  bucketWindows,
  isoDay,
  resolvePeriod,
  truncUnit,
  type Window,
} from "@ecommerce/contracts/shared/periodWindow";
import { campaignTags } from "./campaignTagsService";
import {
  channelInvestmentByBucket,
  cpaSeries,
  funnelTotals,
  investmentByChannel,
  stageSeries,
  type StageRow,
} from "./funnelSummary";
import { lastMonthsWindow } from "./generalMetrics";

type Granularity = "mes" | PeriodSearch["por"];

type StageDbRow = {
  bucket: Date | null;
  platform: AdPlatform;
  stage: StageKey;
  channel: string;
  spend: number;
  platform_fee: number;
  conversions: number;
};

async function stageRows(clientId: string, w: Window, unit: string | null): Promise<StageRow[]> {
  const bucket = unit
    ? Prisma.sql`date_trunc(${unit}, a.date::timestamp)`
    : Prisma.sql`null::timestamp`;
  const rows = await prismaClient.$queryRaw<StageDbRow[]>`
    select ${bucket} as bucket, a.platform, coalesce(t.stage::text, 'UNTAGGED') as stage,
      coalesce(t.channel, ${siteChannel}) as channel,
      coalesce(sum(a.spend), 0)::float8 as spend,
      coalesce(sum(a.platform_fee), 0)::float8 as platform_fee,
      coalesce(sum(a.conversions), 0)::int as conversions
    from ad_spend_daily a
    left join campaign_tag t
      on t.client_id = a.client_id and t.platform = a.platform and t.campaign_id = a.campaign_id
    where a.client_id = ${clientId} and a.date >= ${w.start} and a.date < ${w.end}
    group by 1, 2, 3, 4
  `;
  return rows.map((r) => ({
    bucket: r.bucket ? isoDay(r.bucket) : null,
    platform: r.platform,
    stage: r.stage,
    channel: r.channel,
    spend: r.spend,
    platformFee: r.platform_fee,
    conversions: r.conversions,
  }));
}

async function series(clientId: string, w: Window, granularity: Granularity, fee: boolean) {
  const buckets = bucketWindows(w, granularity).map((b) => b.bucket);
  const [rows, orders] = await Promise.all([
    stageRows(clientId, w, truncUnit[granularity]),
    ordersByBucket(clientId, w, truncUnit[granularity], "ECOMMERCE"),
  ]);
  return {
    stages: stageSeries(buckets, rows, fee),
    cpa: cpaSeries(buckets, rows, orders, fee),
  };
}

export async function channelInvestment(
  clientId: string,
  w: Window,
  fee: boolean,
): Promise<Record<string, number>> {
  return investmentByChannel(await stageRows(clientId, w, null), fee);
}

export async function channelInvestmentBuckets(
  clientId: string,
  w: Window,
  unit: string,
  channel: string,
  fee: boolean,
): Promise<{ bucket: string; investment: number }[]> {
  return channelInvestmentByBucket(await stageRows(clientId, w, unit), channel, fee);
}

export async function investmentFunnel(
  clientId: string,
  input: PeriodSearch & { incluirTaxa: boolean; canEdit: boolean },
  today: string,
): Promise<MarketingInvestmentFunnel> {
  const period = resolvePeriod(input);
  const fee = input.incluirTaxa;
  const [current, previous, monthly, daily, tags, marketplaces] = await Promise.all([
    stageRows(clientId, period.current, null),
    period.previous ? stageRows(clientId, period.previous, null) : null,
    series(clientId, lastMonthsWindow(today, 12), "mes", fee),
    series(clientId, period.current, input.por, fee),
    campaignTags(clientId, period.current),
    marketplaceChannels(clientId, lastMonthsWindow(today, 13)),
  ]);
  return {
    summary: {
      ...funnelTotals(current, previous, fee),
      monthly: monthly.stages,
      daily: daily.stages,
      cpaMonthly: monthly.cpa,
      cpaDaily: daily.cpa,
    },
    tags,
    channels: salesChannelOptions(marketplaces),
    canEdit: input.canEdit,
  };
}
