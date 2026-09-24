import type { BusinessUnit } from "../money/contract";

export const socialPlatforms = ["INSTAGRAM", "FACEBOOK"] as const;
export type SocialPlatform = (typeof socialPlatforms)[number];

export const socialPlatformLabel: Record<SocialPlatform, string> = {
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
};

export const funnelStages = ["TOP", "MIDDLE", "BOTTOM"] as const;
export type FunnelStage = (typeof funnelStages)[number];

export const funnelStageLabel: Record<FunnelStage, string> = {
  TOP: "Topo",
  MIDDLE: "Meio",
  BOTTOM: "Fundo",
};

export const audienceDimensions = ["GENDER", "AGE"] as const;
export type AudienceDimension = (typeof audienceDimensions)[number];

export const audienceDimensionLabel: Record<AudienceDimension, string> = {
  GENDER: "Gênero",
  AGE: "Faixa etária",
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
import type { BenchmarkVerdict, FunnelStep } from "./marketingRules";
import type { MarketingTab } from "./marketingSchema";

export type TrafficAggregate = {
  sessions: number;
  users: number;
  newUsers: number;
  viewItem: number;
  addToCart: number;
  beginCheckout: number;
};

export type TrafficBucket = TrafficAggregate & { bucket: string };

export type ChannelSales = { marketplace: boolean; channel: string; revenue: number };

export type ChannelRoas = {
  key: string;
  label: string;
  revenue: number;
  investment: number;
  roas: number | null;
};

export type AdSpendAggregate = {
  spend: number;
  platformFee: number;
  impressions: number;
  clicks: number;
};

export type AdSpendBucket = AdSpendAggregate & { bucket: string };

export type MarketingCostLine = {
  key: string;
  label: string;
  businessUnit: BusinessUnit;
  amount: number;
};

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
  value: number | null;
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

export type AdPerformanceRow = {
  id: string;
  name: string;
  platform: AdPlatform;
  campaignName: string | null;
  adsetName: string | null;
  spend: number;
  platformFee: number;
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

export type SalesInvestmentPoint = {
  bucket: string;
  sold: number;
  invested: number;
  roas: number | null;
};

export type TrafficPoint = {
  bucket: string;
  sessions: number;
  newUsers: number;
  conversionRate: number | null;
};

export type FunnelStepDelta = FunnelStepValue & {
  previous: number | null;
  fromPrevious: number | null;
};

export type PlatformCard = {
  platform: AdPlatform;
  label: string;
  spend: MetricValue;
  cpc: MetricValue;
  conversions: MetricValue;
  costPerConversion: MetricValue;
};

export type MarketingGeneral = {
  kpis: {
    sold: MetricValue;
    invested: MetricValue;
    roas: MetricValue;
    mer: MetricValue;
    orders: MetricValue;
    aov: MetricValue;
    conversionRate: MetricValue;
    sessions: MetricValue;
  };
  year: { sold: number; invested: number; roas: number | null };
  projection: { month: string; sold: number | null; invested: number | null };
  monthly: SalesInvestmentPoint[];
  daily: SalesInvestmentPoint[];
  trafficMonthly: TrafficPoint[];
  trafficDaily: TrafficPoint[];
  funnel: FunnelStepDelta[];
  platforms: PlatformCard[];
};

export const platformKpis = [
  "spend",
  "impressions",
  "reach",
  "cpm",
  "linkClicks",
  "ctr",
  "cpc",
  "landingPageViews",
  "sessions",
  "costPerSession",
  "addToCart",
  "conversions",
  "costPerConversion",
  "leads",
  "messages",
  "costPerLead",
  "clicks",
  "impressionShare",
] as const;
export type PlatformKpi = (typeof platformKpis)[number];

export type AdDepthRow = {
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
  impressions: number;
  reach: number;
  clicks: number;
  linkClicks: number;
  landingPageViews: number;
  addToCart: number;
  conversions: number;
  leads: number;
  messages: number;
  cpm: number | null;
  ctr: number | null;
  cpc: number | null;
  costPerView: number | null;
  costPerConversion: number | null;
  costPerLead: number | null;
  impressionShare: number | null;
  spendVariation: number | null;
  conversionsVariation: number | null;
  costPerConversionVariation: number | null;
};

export type AdKeywordRow = {
  key: string;
  keyword: string;
  matchType: string;
  adGroupName: string;
  campaignName: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number | null;
  cpc: number | null;
  costPerConversion: number | null;
};

export type PlatformSeriesPoint = {
  bucket: string;
  spend: number;
  conversions: number;
  costPerConversion: number | null;
  sessions: number | null;
  costPerSession: number | null;
};

export type MarketingPlatformTab = {
  platform: AdPlatform;
  accounts: { id: string; name: string }[];
  kpis: Record<PlatformKpi, MetricValue>;
  monthly: PlatformSeriesPoint[];
  daily: PlatformSeriesPoint[];
  rows: AdDepthRow[];
  total: AdDepthRow;
  keywords: AdKeywordRow[];
};

export const siteKpis = [
  "sessions",
  "engagedSessions",
  "users",
  "newUsers",
  "pageViews",
  "averageDuration",
  "engagementRate",
  "bounceRate",
] as const;
export type SiteKpi = (typeof siteKpis)[number];

export type SiteSeriesPoint = {
  bucket: string;
  sessions: number;
  engagedSessions: number;
  engagementRate: number | null;
  users: number;
  newUsers: number;
  newUserShare: number | null;
};

export type SiteAudienceRow = {
  value: string;
  label: string;
  sessions: number;
  engagedSessions: number;
  engagementRate: number | null;
  users: number;
  purchases: number;
  purchaseRate: number | null;
};

export type SitePageRow = {
  path: string;
  pageViews: number;
  sessions: number;
  engagementRate: number | null;
  averageDuration: number | null;
};

export type SiteRegionRow = {
  province: string;
  sessions: number;
  pageViews: number;
  engagementRate: number | null;
  purchases: number;
  purchaseRate: number | null;
};

export type MarketingSiteTab = {
  kpis: Record<SiteKpi, MetricValue>;
  monthly: SiteSeriesPoint[];
  daily: SiteSeriesPoint[];
  gender: SiteAudienceRow[];
  age: SiteAudienceRow[];
  pages: SitePageRow[];
  regions: SiteRegionRow[];
};

export type MarketingScreen =
  | { aba: Extract<MarketingTab, "site">; site: MarketingSiteTab }
  | { aba: Extract<MarketingTab, "meta" | "google">; platformTab: MarketingPlatformTab }
  | { aba: Extract<MarketingTab, "geral">; general: MarketingGeneral }
  | ({ aba: Extract<MarketingTab, "visao"> } & MarketingVisao)
  | { aba: Extract<MarketingTab, "resumo">; summary: MarketingSummary }
  | { aba: Extract<MarketingTab, "campanhas">; campaigns: MarketingCampaigns }
  | { aba: Extract<MarketingTab, "descontos">; discounts: MarketingDiscounts }
  | { aba: Extract<MarketingTab, "regioes">; regions: MarketingRegions }
  | { aba: Extract<MarketingTab, "social">; social: MarketingSocial };
