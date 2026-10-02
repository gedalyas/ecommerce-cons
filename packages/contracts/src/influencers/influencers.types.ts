export const influencerStatuses = ["ACTIVE", "PAUSED", "ARCHIVED"] as const;
export type InfluencerStatus = (typeof influencerStatuses)[number];

export const influencerRuleTypes = [
  "FIXED",
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "PER_ORDER",
  "PERCENT_OF_PRODUCTS",
  "PERCENT_OF_TOTAL",
] as const;
export type InfluencerRuleType = (typeof influencerRuleTypes)[number];

export const influencerStatusLabel: Record<InfluencerStatus, string> = {
  ACTIVE: "Ativo",
  PAUSED: "Pausado",
  ARCHIVED: "Arquivado",
};

export const influencerRuleTypeLabel: Record<InfluencerRuleType, string> = {
  FIXED: "Taxa fixa",
  DAILY: "Recorrente diária",
  WEEKLY: "Recorrente semanal",
  MONTHLY: "Recorrente mensal",
  PER_ORDER: "Por pedido (fixo)",
  PERCENT_OF_PRODUCTS: "Por pedido (% dos produtos)",
  PERCENT_OF_TOTAL: "Por pedido (% do total)",
};

export const percentRuleTypes: readonly InfluencerRuleType[] = [
  "PERCENT_OF_PRODUCTS",
  "PERCENT_OF_TOTAL",
];

export type InfluencerRule = {
  id: string;
  type: InfluencerRuleType;
  value: number;
  startDate: string;
  endDate: string | null;
  cap: number | null;
  notes: string;
};

export type InfluencerCoupon = {
  id: string;
  code: string;
  activeFrom: string | null;
  activeUntil: string | null;
};

export type Influencer = {
  id: string;
  name: string;
  handle: string;
  status: InfluencerStatus;
  notes: string;
  rules: InfluencerRule[];
  coupons: InfluencerCoupon[];
};

export type InfluencerActivity = {
  orders: number;
  revenue: number;
  productRevenue: number;
  shippingRevenue: number;
  customers: number;
  newCustomers: number;
  repeatOrders: number;
};

export type InfluencerRow = Influencer &
  InfluencerActivity & {
    cost: number;
    roi: number | null;
    repurchaseRate: number | null;
  };

export type InfluencerTotals = InfluencerActivity & {
  cost: number;
  roi: number | null;
  repurchaseRate: number | null;
};

export type InfluencersScreen = {
  rows: InfluencerRow[];
  totals: InfluencerTotals;
  counts: Record<InfluencerStatus, number>;
  couponNotice: string | null;
};
