import type {
  AdPlatform,
  AudienceDimension,
  FinancialStatus,
  Fulfillment,
  ProcessingMethod,
  SalesPlatform,
  SocialPlatform,
} from "@ecommerce/database/enums";

export type OrderLine = {
  row: number;
  number: string;
  placedAt: string;
  status: FinancialStatus;
  email: string;
  customerName: string;
  city: string;
  province: string;
  salesPlatform: SalesPlatform;
  channel: string;
  gateway: string;
  processingMethod: ProcessingMethod;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  coupons: string[];
  shipping: number;
  discount: number;
  sku: string;
  productName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  unitCost: number | null;
};

export type OrderItemInput = {
  sku: string;
  productName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  unitCost: number | null;
};

export type OrderInput = Omit<
  OrderLine,
  "row" | "sku" | "productName" | "category" | "quantity" | "unitPrice" | "unitCost"
> & {
  rows: number[];
  items: OrderItemInput[];
  productRevenue: number;
  totalPrice: number;
  fulfillment?: Fulfillment | null;
};

export type AdSpendRow = {
  row: number;
  date: string;
  platform: AdPlatform;
  campaignId: string;
  campaignName: string;
  adsetId: string;
  adsetName: string;
  adId: string;
  adName: string;
  spend: number;
  platformFee: number;
  impressions: number;
  clicks: number;
  conversions: number;
  attributedRevenue: number;
  accountId?: string;
  accountName?: string;
  campaignType?: string | null;
  reach?: number;
  linkClicks?: number;
  landingPageViews?: number;
  addToCart?: number;
  leads?: number;
  messages?: number;
  eligibleImpressions?: number;
  thumbnailUrl?: string | null;
};

export type TrafficRow = {
  row: number;
  date: string;
  source: string;
  medium: string;
  sessions: number;
  users: number;
  newUsers: number;
  viewItem: number;
  addToCart: number;
  beginCheckout: number;
  engagedSessions?: number;
  pageViews?: number;
  durationSeconds?: number;
  purchases?: number;
};

export type KeywordRow = {
  date: string;
  platform: AdPlatform;
  accountId: string;
  campaignId: string;
  campaignName: string;
  adGroupId: string;
  adGroupName: string;
  keyword: string;
  matchType: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
};

export type PageRow = {
  date: string;
  pagePath: string;
  pageViews: number;
  sessions: number;
  engagedSessions: number;
  durationSeconds: number;
};

export type ItemRow = {
  date: string;
  itemId: string;
  itemName: string;
  itemsViewed: number;
  itemsAddedToCart: number;
  itemsPurchased: number;
};

export type AudienceRow = {
  date: string;
  dimension: AudienceDimension;
  value: string;
  sessions: number;
  engagedSessions: number;
  users: number;
  purchases: number;
};

export type RegionRow = {
  date: string;
  province: string;
  sessions: number;
  pageViews: number;
  engagedSessions: number;
  purchases: number;
};

export type TrafficDetail = {
  pages: PageRow[];
  items: ItemRow[];
  audience: AudienceRow[];
  regions: RegionRow[];
};

export type SocialDailyRow = {
  platform: SocialPlatform;
  accountId: string;
  date: string;
  followers: number;
  reach: number;
  engagement: number;
  posts: number;
};

export type SocialPostInput = {
  platform: SocialPlatform;
  accountId: string;
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
};

export type SocialInput = { daily: SocialDailyRow[]; posts: SocialPostInput[] };
