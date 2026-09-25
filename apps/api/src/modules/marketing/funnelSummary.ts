import {
  adPlatforms,
  siteChannel,
  stageKeys,
  type AdPlatform,
  type CpaSeriesPoint,
  type InvestmentFunnelSummary,
  type StageCreative,
  type StageCreatives,
  type StageKey,
  type StageSeriesPoint,
} from "@ecommerce/contracts/marketing";
import { metricValue } from "@ecommerce/contracts/shared/metricValue";
import { ratio } from "./marketingMetrics";

export type StageRow = {
  bucket: string | null;
  platform: AdPlatform;
  stage: StageKey;
  channel: string;
  spend: number;
  platformFee: number;
  conversions: number;
};

type Totals = Pick<InvestmentFunnelSummary, "total" | "stages" | "platforms">;

const spendOf = (rows: readonly StageRow[], fee: boolean) =>
  rows.reduce((s, r) => s + r.spend + (fee ? r.platformFee : 0), 0);

const share = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : null);

export function funnelTotals(
  current: readonly StageRow[],
  previous: readonly StageRow[] | null,
  fee: boolean,
): Totals {
  const total = spendOf(current, fee);
  const prevOf = (keep: (r: StageRow) => boolean) =>
    previous ? spendOf(previous.filter(keep), fee) : null;
  const stages = stageKeys.map((stage) => {
    const rows = current.filter((r) => r.stage === stage);
    const spend = spendOf(rows, fee);
    return {
      stage,
      spend: metricValue(
        "currency",
        spend,
        prevOf((r) => r.stage === stage),
      ),
      share: share(spend, total),
      byPlatform: adPlatforms.map((platform) => {
        const value = spendOf(
          rows.filter((r) => r.platform === platform),
          fee,
        );
        return { platform, spend: value, share: share(value, spend) };
      }),
    };
  });
  const platforms = adPlatforms.map((platform) => {
    const spend = spendOf(
      current.filter((r) => r.platform === platform),
      fee,
    );
    return {
      platform,
      spend: metricValue(
        "currency",
        spend,
        prevOf((r) => r.platform === platform),
      ),
      share: share(spend, total),
    };
  });
  return {
    total: metricValue("currency", total, previous ? spendOf(previous, fee) : null),
    stages,
    platforms,
  };
}

export function stageSeries(
  buckets: readonly string[],
  rows: readonly StageRow[],
  fee: boolean,
): StageSeriesPoint[] {
  return buckets.map((bucket) => {
    const inBucket = rows.filter((r) => r.bucket === bucket);
    const point = { bucket, TOP: 0, MIDDLE: 0, BOTTOM: 0, UNTAGGED: 0 };
    for (const stage of stageKeys) {
      point[stage] = spendOf(
        inBucket.filter((r) => r.stage === stage),
        fee,
      );
    }
    return point;
  });
}

export function cpaSeries(
  buckets: readonly string[],
  rows: readonly StageRow[],
  siteOrders: readonly { bucket: string; orders: number }[],
  fee: boolean,
): CpaSeriesPoint[] {
  const orders = new Map(siteOrders.map((o) => [o.bucket, o.orders]));
  return buckets.map((bucket) => {
    const inBucket = rows.filter((r) => r.bucket === bucket);
    const siteSpend = spendOf(
      inBucket.filter((r) => r.channel === siteChannel),
      fee,
    );
    const platformCpa = (platform: AdPlatform) => {
      const own = inBucket.filter((r) => r.platform === platform);
      return ratio(
        spendOf(own, fee),
        own.reduce((s, r) => s + r.conversions, 0),
      );
    };
    return {
      bucket,
      site: ratio(siteSpend, orders.get(bucket) ?? 0),
      META: platformCpa("META"),
      GOOGLE: platformCpa("GOOGLE"),
      TIKTOK: platformCpa("TIKTOK"),
    };
  });
}

export function investmentByChannel(
  rows: readonly StageRow[],
  fee: boolean,
): Record<string, number> {
  const byChannel: Record<string, number> = {};
  for (const r of rows) {
    byChannel[r.channel] = (byChannel[r.channel] ?? 0) + r.spend + (fee ? r.platformFee : 0);
  }
  return byChannel;
}

export function channelInvestmentByBucket(
  rows: readonly StageRow[],
  channel: string,
  fee: boolean,
): { bucket: string; investment: number }[] {
  const byBucket = new Map<string, number>();
  for (const r of rows) {
    if (r.bucket == null || r.channel !== channel) continue;
    byBucket.set(r.bucket, (byBucket.get(r.bucket) ?? 0) + r.spend + (fee ? r.platformFee : 0));
  }
  return [...byBucket].map(([bucket, investment]) => ({ bucket, investment }));
}

export type CreativeRow = Omit<StageCreative, "ctr" | "costPerConversion"> & {
  stage: StageKey;
  platformFee: number;
  impressions: number;
  clicks: number;
};

export function topCreativesByStage(
  rows: readonly CreativeRow[],
  fee: boolean,
  limit: number,
): StageCreatives[] {
  return stageKeys.map((stage) => ({
    stage,
    ads: rows
      .filter((r) => r.stage === stage)
      .map(({ stage: _stage, platformFee, impressions, clicks, ...ad }) => {
        const spend = ad.spend + (fee ? platformFee : 0);
        return {
          ...ad,
          spend,
          ctr: impressions > 0 ? (clicks / impressions) * 100 : null,
          costPerConversion: ratio(spend, ad.conversions),
        };
      })
      .sort((a, b) => b.spend - a.spend || a.adId.localeCompare(b.adId))
      .slice(0, limit),
  }));
}
