import type { BusinessUnit } from "../money/contract";

export const socialPlatforms = ["INSTAGRAM", "FACEBOOK"] as const;
export type SocialPlatform = (typeof socialPlatforms)[number];

export const socialPlatformLabel: Record<SocialPlatform, string> = {
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
};

export const adPlatforms = ["META", "GOOGLE", "TIKTOK"] as const;
export type AdPlatform = (typeof adPlatforms)[number];

export const adPlatformLabel: Record<AdPlatform, string> = {
  META: "Meta Ads",
  GOOGLE: "Google Ads",
  TIKTOK: "TikTok Ads",
};
import type { ConsultingSection } from "../consulting/contract";
import type { BreakdownSlice, MetricValue, Series, SeriesPoint } from "../shared/metric.types";
import type { BenchmarkVerdict, FunnelStep, RoasQuality } from "./marketingRules";
import type { MarketingTab } from "./marketingSchema";

/** Site traffic and funnel events over a window (store only; marketplaces have no sessions). */
export type TrafficAggregate = {
  sessions: number;
  users: number;
  newUsers: number;
  viewItem: number;
  addToCart: number;
  beginCheckout: number;
};

export type TrafficBucket = TrafficAggregate & { bucket: string };

/** Paid-media totals over a window. The platform fee is kept apart from spend on purpose. */
export type AdSpendAggregate = {
  spend: number;
  platformFee: number;
  impressions: number;
  clicks: number;
  attributedRevenue: number;
};

export type AdSpendBucket = AdSpendAggregate & { bucket: string };

// ---------------------------------------------------------------------------
// Marketing screen payloads
// ---------------------------------------------------------------------------

/**
 * A marketing cost line the money module accrues over the window (agency,
 * e-mail tool, ad taxes...). Marketing declares the shape and the route
 * feeds it, because money already depends on marketing for the ad spend.
 */
export type MarketingCostLine = {
  key: string;
  label: string;
  businessUnit: BusinessUnit;
  amount: number;
};

/** What the Retenção pillar needs from the customer base; filled by the route. */
export type MarketingRetention = { repurchaseRate90: number | null; ltv12Months: number | null };

export type MarketingOverview = {
  conversionRate: MetricValue;
  aov: MetricValue;
  cartAbandonment: MetricValue;
  cac: MetricValue;
  roas: MetricValue;
  adSpend: MetricValue;
  topChannelShare: MetricValue;
  topChannel: string | null;
};

export type ChannelPerformanceRow = {
  key: "ecommerce" | "marketplace" | "total";
  label: string;
  investment: number;
  revenue: number;
  orders: number;
  roi: number | null;
  roas: number | null;
  cpa: number | null;
  conversionRate: number | null;
};

export type FunnelStepValue = { key: FunnelStep; label: string; value: number };

export type FunnelRatioRow = {
  key: string;
  label: string;
  /** Percent over the period, null when the source step is empty. */
  value: number | null;
  /** The store's own historical average, percent. */
  average: number | null;
  benchmark: { min: number; max: number };
  verdict: BenchmarkVerdict | null;
};

export type UtmSalesRow = {
  key: string;
  label: string;
  orders: number;
  revenue: number;
  share: number;
  aov: number;
};

export type MarketingSummary = {
  channels: ChannelPerformanceRow[];
  investmentBreakdown: BreakdownSlice[];
  investmentSeries: SeriesPoint[];
  investmentMetricSeries: SeriesPoint[];
  sessionsSeries: SeriesPoint[];
  sessionsMetricSeries: SeriesPoint[];
  funnel: { steps: FunnelStepValue[]; ratios: FunnelRatioRow[] };
  utmSales: UtmSalesRow[];
};

/** One row of paid media at any level: platform, campaign, ad set or ad. */
export type AdPerformanceRow = {
  id: string;
  name: string;
  platform: AdPlatform;
  campaignName: string | null;
  adsetName: string | null;
  spend: number;
  platformFee: number;
  revenue: number;
  roas: number | null;
  roasQuality: RoasQuality;
  orders: number;
  cpa: number | null;
  impressions: number;
  cpm: number | null;
  clicks: number;
  cpc: number | null;
  ctr: number | null;
};

export type MarketingCampaigns = {
  platforms: AdPerformanceRow[];
  total: AdPerformanceRow;
  /** The selected ad metric per bucket, one line per platform. */
  platformSeries: { key: string; label: string; points: SeriesPoint[] }[];
  rows: AdPerformanceRow[];
  best: AdPerformanceRow[];
  worst: AdPerformanceRow[];
};

export type DiscountCodeRow = {
  code: string;
  orders: number;
  revenue: number;
  discounts: number;
  /** Discounts over gross (revenue + discounts), percent. */
  discountRate: number | null;
  aov: number;
  firstOrders: number;
};

export const discountMetricKeys = [
  "couponOrders",
  "couponShare",
  "discounts",
  "couponRevenue",
  "discountRate",
  "aovWithCoupon",
  "aovWithoutCoupon",
] as const;
export type DiscountMetricKey = (typeof discountMetricKeys)[number];

export type DiscountMetric = {
  key: DiscountMetricKey;
  label: string;
  metric: MetricValue;
  goodWhen: "up" | "down";
};

export type MarketingDiscounts = {
  metrics: DiscountMetric[];
  codes: DiscountCodeRow[];
  discountsSeries: SeriesPoint[];
  couponRevenueSeries: SeriesPoint[];
};

export type RegionPerformanceRow = {
  province: string;
  metaSpend: number;
  googleSpend: number;
  tiktokSpend: number;
  totalSpend: number;
  revenue: number;
  roas: number | null;
  cpm: number | null;
  cpc: number | null;
  cpa: number | null;
  cac: number | null;
  customers: number;
  averageTicket: number | null;
  repurchaseRate: number | null;
  impressions: number;
  clicks: number;
  orders: number;
  newCustomers: number;
  repeatOrders: number;
};

export type MarketingRegions = {
  rows: RegionPerformanceRow[];
  total: RegionPerformanceRow;
};

export type SocialAccountRow = {
  platform: SocialPlatform;
  accountId: string;
  followers: number;
  reach: number;
  engagement: number;
  posts: number;
  engagementRate: number | null;
};

export type SocialPostRow = {
  platform: SocialPlatform;
  externalId: string;
  mediaType: string;
  publishedAt: string;
  permalink: string;
  caption: string;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  reach: number;
  engagement: number;
};

export type MarketingSocial = {
  followers: MetricValue;
  reach: MetricValue;
  engagement: MetricValue;
  posts: MetricValue;
  engagementRate: MetricValue;
  reachSeries: Series;
  accounts: SocialAccountRow[];
  topPosts: SocialPostRow[];
};

export type StaleSource = { name: string; syncLabel: string };

export type MarketingVisao = {
  overview: MarketingOverview;
  section: ConsultingSection;
  staleSources: StaleSource[];
  retention: MarketingRetention;
};

export type MarketingScreen =
  | ({ aba: Extract<MarketingTab, "visao"> } & MarketingVisao)
  | { aba: Extract<MarketingTab, "resumo">; summary: MarketingSummary }
  | { aba: Extract<MarketingTab, "campanhas">; campaigns: MarketingCampaigns }
  | { aba: Extract<MarketingTab, "descontos">; discounts: MarketingDiscounts }
  | { aba: Extract<MarketingTab, "regioes">; regions: MarketingRegions }
  | { aba: Extract<MarketingTab, "social">; social: MarketingSocial };
