export const alertKinds = [
  "salesDrop",
  "trafficDrop",
  "productSalesDrop",
  "lowStockRisk",
  "keyVariantsUnavailable",
] as const;
export type AlertKind = (typeof alertKinds)[number];

export const alertKindLabel: Record<AlertKind, string> = {
  salesDrop: "Queda de vendas",
  trafficDrop: "Queda de tráfego",
  productSalesDrop: "Queda de vendas do produto",
  lowStockRisk: "Risco de baixo estoque",
  keyVariantsUnavailable: "Variantes importantes indisponíveis",
};

export type AlertSeverity = "attention" | "review";

export type AlertItem = {
  kind: AlertKind;
  severity: AlertSeverity;
  title: string;
  detail: string;
  origin: string;
  to: string;
  search: Record<string, string> | null;
};

export type WeekPair = { current: number; previous: number };

export type ProductWeekPair = { name: string; current: number; previous: number };

export type VariantStock = {
  productName: string;
  variantName: string | null;
  sku: string;
  stockQty: number;
  sold30: number;
  sold90: number;
  marketplaceStock: boolean;
};

export type AlertFacts = {
  revenue: WeekPair;
  sessions: WeekPair;
  products: ProductWeekPair[];
  variants: VariantStock[];
};
