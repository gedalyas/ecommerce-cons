import type { MetricUnit, MetricValue } from "@/shared/models/types/metric.types";
import type { ProductsFilterKey, ProductsTab } from "./productsSchema";

export type AbcClass = "A" | "B" | "C";

/** One product's sales over a window, with the catalog attributes the filters use. */
export type ProductSales = {
  productId: string;
  name: string;
  category: string;
  subcategory: string | null;
  brand: string | null;
  collection: string | null;
  units: number;
  revenue: number;
  cost: number;
  orders: number;
  stockQty: number;
};

export type ProductRow = ProductSales & {
  abcClass: AbcClass;
  /** Share of the revenue of every product in the window, in percent. */
  revenueShare: number;
  profit: number;
  averagePrice: number | null;
  margin: number | null;
  stockHealth: "ok" | "risco" | "sem-estoque";
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

/** One variant's stock position, with the sales windows and the derived projections. */
export type InventoryRow = {
  variantId: string;
  productName: string;
  variantName: string | null;
  sku: string;
  category: string;
  subcategory: string | null;
  brand: string | null;
  collection: string | null;
  stockQty: number;
  price: number;
  cost: number | null;
  lastSaleAt: string | null;
  soldTotal: number;
  sold90: number;
  sold30: number;
  sold7: number;
  /** Units per day over the last 30 days (90 when the last 30 had none). */
  velocity: number;
  daysToZero: number | null;
  stockOutDate: string | null;
  stockValue: number | null;
  revenuePotential: number;
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
};

export type ProductsList = {
  abc: AbcSummary[];
  rows: ProductRow[];
  options: ProductsFilterOptions;
};

export type ProductsInventory = {
  rows: InventoryRow[];
  options: ProductsFilterOptions;
};

export type ProductsScreen =
  | { aba: Extract<ProductsTab, "resumo">; summary: ProductsSummary }
  | { aba: Extract<ProductsTab, "lista">; list: ProductsList }
  | { aba: Extract<ProductsTab, "estoque">; inventory: ProductsInventory };

/** What Logística needs from the stock: rupture share and coverage in days. */
export type InventoryHealth = {
  variants: number;
  outOfStock: number;
  stockOutRate: number | null;
  coverageDays: number | null;
};
