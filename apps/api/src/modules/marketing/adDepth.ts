import type {
  AdDepthRow,
  AdPlatform,
  PlatformKpi,
  PlatformSeriesPoint,
} from "@ecommerce/contracts/marketing";
import type { MetricUnit } from "@ecommerce/contracts/shared/metric.types";

export type AdDepthSums = {
  key: string;
  id: string;
  name: string;
  campaignId: string;
  campaignName: string | null;
  adsetId: string | null;
  adsetName: string | null;
  campaignType: string | null;
  thumbnailUrl: string | null;
  spend: number;
  platformFee: number;
  impressions: number;
  eligibleImpressions: number;
  reach: number;
  clicks: number;
  linkClicks: number;
  landingPageViews: number;
  addToCart: number;
  conversions: number;
  leads: number;
  messages: number;
};

const ratio = (a: number, b: number) => (b > 0 ? a / b : null);
const variation = (current: number | null, previous: number | null) =>
  current == null || previous == null || previous === 0
    ? null
    : ((current - previous) / previous) * 100;

export function deriveDepth(
  sums: AdDepthSums,
  previous: AdDepthSums | null,
  includeFee: boolean,
): AdDepthRow {
  const spendOf = (s: AdDepthSums) => s.spend + (includeFee ? s.platformFee : 0);
  const spend = spendOf(sums);
  const costPerConversion = ratio(spend, sums.conversions);
  const prevSpend = previous ? spendOf(previous) : null;
  const prevCost = previous && prevSpend != null ? ratio(prevSpend, previous.conversions) : null;
  const { platformFee: _fee, eligibleImpressions: _eligible, ...rest } = sums;
  return {
    ...rest,
    spend,
    cpm: sums.impressions > 0 ? (spend / sums.impressions) * 1000 : null,
    ctr: sums.impressions > 0 ? (sums.clicks / sums.impressions) * 100 : null,
    cpc: ratio(spend, sums.clicks),
    costPerView: ratio(spend, sums.landingPageViews),
    costPerConversion,
    costPerLead: ratio(spend, sums.leads),
    impressionShare:
      sums.eligibleImpressions > 0 ? (sums.impressions / sums.eligibleImpressions) * 100 : null,
    spendVariation: variation(spend, prevSpend),
    conversionsVariation: variation(sums.conversions, previous?.conversions ?? null),
    costPerConversionVariation: variation(costPerConversion, prevCost),
  };
}

export function sumDepth(rows: readonly AdDepthSums[], id: string, name: string): AdDepthSums {
  const total: AdDepthSums = {
    key: id,
    id,
    name,
    campaignId: id,
    campaignName: null,
    adsetId: null,
    adsetName: null,
    campaignType: null,
    thumbnailUrl: null,
    spend: 0,
    platformFee: 0,
    impressions: 0,
    eligibleImpressions: 0,
    reach: 0,
    clicks: 0,
    linkClicks: 0,
    landingPageViews: 0,
    addToCart: 0,
    conversions: 0,
    leads: 0,
    messages: 0,
  };
  for (const r of rows) {
    total.spend += r.spend;
    total.platformFee += r.platformFee;
    total.impressions += r.impressions;
    total.eligibleImpressions += r.eligibleImpressions;
    total.reach += r.reach;
    total.clicks += r.clicks;
    total.linkClicks += r.linkClicks;
    total.landingPageViews += r.landingPageViews;
    total.addToCart += r.addToCart;
    total.conversions += r.conversions;
    total.leads += r.leads;
    total.messages += r.messages;
  }
  return total;
}

const PLATFORM_SOURCES: Record<AdPlatform, readonly string[]> = {
  META: ["meta", "facebook", "instagram", "fb", "ig"],
  GOOGLE: ["google"],
  TIKTOK: ["tiktok"],
};

export const paidMediums = ["cpc", "paid-social", "paid", "ppc", "paidsocial", "paid_social"];

export const trafficSourcesOf = (platform: AdPlatform) => PLATFORM_SOURCES[platform];

export function platformSeries(
  buckets: readonly string[],
  ads: readonly { bucket: string; spend: number; conversions: number }[],
  sessions: readonly { bucket: string; sessions: number }[] | null,
): PlatformSeriesPoint[] {
  const a = new Map(ads.map((r) => [r.bucket, r]));
  const s = sessions ? new Map(sessions.map((r) => [r.bucket, r.sessions])) : null;
  return buckets.map((bucket) => {
    const spend = a.get(bucket)?.spend ?? 0;
    const conversions = a.get(bucket)?.conversions ?? 0;
    const visits = s ? (s.get(bucket) ?? 0) : null;
    return {
      bucket,
      spend,
      conversions,
      costPerConversion: ratio(spend, conversions),
      sessions: visits,
      costPerSession: visits == null ? null : ratio(spend, visits),
    };
  });
}

export const platformKpiUnit: Record<PlatformKpi, MetricUnit> = {
  spend: "currency",
  impressions: "count",
  reach: "count",
  cpm: "currency",
  linkClicks: "count",
  ctr: "percent",
  cpc: "currency",
  landingPageViews: "count",
  sessions: "count",
  costPerSession: "currency",
  addToCart: "count",
  conversions: "count",
  costPerConversion: "currency",
  leads: "count",
  messages: "count",
  costPerLead: "currency",
  clicks: "count",
  impressionShare: "percent",
};

export function platformKpiValues(
  row: AdDepthRow,
  sessions: number | null,
): Record<PlatformKpi, number | null> {
  return {
    spend: row.spend,
    impressions: row.impressions,
    reach: row.reach,
    cpm: row.cpm,
    linkClicks: row.linkClicks,
    ctr: row.ctr,
    cpc: row.cpc,
    landingPageViews: row.landingPageViews,
    sessions,
    costPerSession: sessions == null ? null : ratio(row.spend, sessions),
    addToCart: row.addToCart,
    conversions: row.conversions,
    costPerConversion: row.costPerConversion,
    leads: row.leads,
    messages: row.messages,
    costPerLead: row.costPerLead,
    clicks: row.clicks,
    impressionShare: row.impressionShare,
  };
}
