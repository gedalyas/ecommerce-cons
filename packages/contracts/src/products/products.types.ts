import type { MetricUnit, MetricValue } from "../shared/metric.types";
import type { ProductsFilterKey, ProductsTab } from "./productsSchema";

export type AbcClass = "A" | "B" | "C";

export type ProductSales = {
  productId: string;
  name: string;
  category: string;
  subcategory: string | null;
  brand: string | null;
  collection: string | null;
  units: number;
  revenue: number;
  cost: number | null;
  orders: number;
  stockQty: number | null;
};

export type ProductRow = ProductSales & {
  abcClass: AbcClass;
  revenueShare: number;
  profit: number | null;
  averagePrice: number | null;
  margin: number | null;
  stockHealth: "ok" | "risco" | "sem-estoque" | null;
};

export type AbcSummary = {
  abcClass: AbcClass;
  products: number;
  revenue: number;
  revenueShare: number;
};

export type ProductsFilterOptions = Record<ProductsFilterKey, { value: string; label: string }[]>;

export const productsSummaryKeys = [
  "productRevenue",
  "units",
  "averageItemValue",
  "itemsPerOrder",
] as const;
export type ProductsSummaryKey = (typeof productsSummaryKeys)[number];

export type ProductsSummaryMetric = {
  key: ProductsSummaryKey;
  label: string;
  unit: MetricUnit;
  goodWhen: "up" | "down";
  metric: MetricValue;
};

export type BoughtTogetherRow = {
  productA: string;
  productB: string;
  times: number;
  averageBundle: number;
};

export type InventoryRow = {
  variantId: string;
  productName: string;
  variantName: string | null;
  sku: string;
  category: string;
  subcategory: string | null;
  brand: string | null;
  collection: string | null;
  stockQty: number | null;
  price: number;
  cost: number | null;
  lastSaleAt: string | null;
  soldTotal: number;
  sold90: number;
  sold30: number;
  sold7: number;
  sold30Marketplace: number;
  marketplaceStock: boolean;
  velocity: number;
  daysToZero: number | null;
  stockOutDate: string | null;
  stockValue: number | null;
  revenuePotential: number | null;
  daysOutOfStock: number | null;
  lostRevenueSinceStockOut: number | null;
  stockOutCostPerDay: number | null;
};

export type ProductsSummary = {
  metrics: ProductsSummaryMetric[];
  topByVolume: ProductRow[];
  bottomByVolume: ProductRow[];
  atRisk: InventoryRow[];
  outOfStock: InventoryRow[];
  boughtTogether: BoughtTogetherRow[];
  stock: InventoryHealth;
};

export type ProductsList = {
  abc: AbcSummary[];
  rows: ProductRow[];
  options: ProductsFilterOptions;
};

export type ProductsInventory = {
  rows: InventoryRow[];
  stock: InventoryHealth;
  options: ProductsFilterOptions;
};

export type ProductsScreen =
  | { aba: Extract<ProductsTab, "resumo">; summary: ProductsSummary }
  | { aba: Extract<ProductsTab, "lista">; list: ProductsList }
  | { aba: Extract<ProductsTab, "estoque">; inventory: ProductsInventory };

export type InventoryHealth = {
  variants: number;
  untracked: number;
  outOfStock: number;
  stockOutRate: number | null;
  coverageDays: number | null;
};
