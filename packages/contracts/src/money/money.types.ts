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

/** A cost or expense rule as the cost engine consumes it (dates as ISO `YYYY-MM-DD`). */
export type CostRule = {
  id: string;
  name: string;
  businessUnit: BusinessUnit;
  category: CostCategory;
  subcategory: string;
  frequency: CostFrequency;
  /** BRL, or percentage points for the PERCENT_* frequencies. */
  value: number;
  startDate: string;
  endDate: string | null;
};

/** A rule as the registry table shows it. */
export type CostRuleRow = CostRule & { description: string };

/** The activity a percentage/per-order rule applies to, split by business unit. */
export type CostActivity = {
  ecommerce: { orders: number; revenue: number };
  marketplace: { orders: number; revenue: number };
  adSpend: number;
};

/** What the rules add up to over a window, by DRE line. */
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
  /** Indentation level in the statement (0 = total line). */
  level: number;
  values: (number | null)[];
  total: number;
  previousTotal: number | null;
};

export type MoneyDre = {
  indicators: DreIndicator[];
  matrix: { buckets: string[]; rows: DreMatrixRow[] };
};

export type MoneyTabData =
  | { aba: Extract<MoneyTab, "visao">; indicators: DreIndicator[] }
  | { aba: Extract<MoneyTab, "dre">; dre: MoneyDre }
  | { aba: Extract<MoneyTab, "custos">; rules: CostRuleRow[] };

export type MoneyScreen = { section: ConsultingSection } & MoneyTabData;

/** A "Vendas e marketing" line accrued over a period, as the Marketing screen consumes it. */
export type MarketingCostLine = {
  key: string;
  label: string;
  businessUnit: BusinessUnit;
  amount: number;
};
