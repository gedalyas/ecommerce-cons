import type {
  AdPlatform,
  FinancialStatus,
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
