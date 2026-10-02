import type { BusinessUnit, CostCategory, CostFrequency } from "./costSets";
import type { ConsultingSection } from "../consulting/contract";
import type { MetricUnit, MetricValue } from "../shared/metric.types";
import type { MoneyTab } from "./moneySchema";

export const dreLineKeys = [
  "revenue",
  "productRevenue",
  "shippingRevenue",
  "totalCosts",
  "cogs",
  "sellingCosts",
  "grossProfit",
  "marketingExpenses",
  "contributionMargin",
  "operatingExpenses",
  "netProfit",
] as const;
export type DreLineKey = (typeof dreLineKeys)[number];

export const dreIndicatorKeys = [
  "grossMargin",
  "contributionMarginRate",
  "netMargin",
  "cogsRate",
  "sellingCostRate",
  "marketingRate",
  "shippingCostPerOrder",
] as const;
export type DreIndicatorKey = (typeof dreIndicatorKeys)[number];

export type CostRule = {
  id: string;
  name: string;
  businessUnit: BusinessUnit;
  category: CostCategory;
  subcategory: string;
  frequency: CostFrequency;
  value: number;
  startDate: string;
  endDate: string | null;
};

export type CostRuleRow = CostRule & { description: string };

export type CostActivity = {
  ecommerce: { orders: number; revenue: number };
  marketplace: { orders: number; revenue: number };
  adSpend: number;
};

export type CostTotals = {
  cogs: number;
  salesMarketing: number;
  operational: number;
  total: number;
};

export type DreIndicator = {
  key: DreIndicatorKey;
  label: string;
  unit: MetricUnit;
  goodWhen: "up" | "down";
  metric: MetricValue;
};

export type DreMatrixRow = {
  key: DreLineKey;
  label: string;
  level: number;
  values: (number | null)[];
  total: number | null;
  previousTotal: number | null;
};

export type MoneyDre = {
  indicators: DreIndicator[];
  costCoverage: number | null;
  matrix: { buckets: string[]; rows: DreMatrixRow[] };
};

export type MoneyTabData =
  | { aba: Extract<MoneyTab, "visao">; indicators: DreIndicator[]; costCoverage: number | null }
  | { aba: Extract<MoneyTab, "dre">; dre: MoneyDre }
  | { aba: Extract<MoneyTab, "custos">; rules: CostRuleRow[] };

export type MoneyScreen = { section: ConsultingSection } & MoneyTabData;

export type MarketingCostLine = {
  key: string;
  label: string;
  businessUnit: BusinessUnit;
  amount: number;
};
