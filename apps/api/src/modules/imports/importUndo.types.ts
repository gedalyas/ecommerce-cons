import type {
  AdPlatform,
  FinancialStatus,
  Fulfillment,
  ProcessingMethod,
  SalesPlatform,
} from "@ecommerce/database/enums";

export const undoEntities = ["ORDER", "CUSTOMER", "PRODUCT", "AD_SPEND_DAY", "TRAFFIC"] as const;
export type UndoEntity = (typeof undoEntities)[number];

export type OrderItemSnapshot = {
  productId: string;
  variantId: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  unitCost: number | null;
};

export type OrderSnapshot = {
  customerId: string;
  placedAt: string;
  paidAt: string | null;
  salesPlatform: SalesPlatform;
  channel: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  financialStatus: FinancialStatus;
  paymentGateway: string;
  processingMethod: ProcessingMethod;
  fulfillment?: Fulfillment | null;
  productRevenue: number;
  shippingRevenue: number;
  totalDiscounts: number;
  totalPrice: number;
  discountCodes: string[];
  country: string;
  province: string;
  city: string;
  orderNumberForCustomer: number;
  itemsCount: number;
  source?: string | null;
  connectionId?: string | null;
  items: OrderItemSnapshot[];
};

export type CustomerSnapshot = { name: string };

export type AdSpendSnapshot = {
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

export type TrafficSnapshot = {
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

export type UndoEntry =
  | { entity: "ORDER"; key: string; previous: OrderSnapshot | null }
  | { entity: "CUSTOMER"; key: string; previous: CustomerSnapshot | null }
  | { entity: "PRODUCT"; key: string; previous: null }
  | { entity: "AD_SPEND_DAY"; key: string; previous: AdSpendSnapshot[] | null }
  | { entity: "TRAFFIC"; key: string; previous: TrafficSnapshot | null };

export type AdSpendDayKey = { platform: AdPlatform; date: string; accountId: string | null };
export type TrafficKey = { date: string; source: string; medium: string };

export type UndoPlan = {
  ordersToDelete: string[];
  ordersToRestore: { number: string; snapshot: OrderSnapshot }[];
  customersToDelete: string[];
  customersToRename: { email: string; name: string }[];
  productsToDelete: string[];
  adSpendDays: { key: AdSpendDayKey; rows: AdSpendSnapshot[] }[];
  traffic: { key: TrafficKey; previous: TrafficSnapshot | null }[];
};
