import type { BusinessUnit, CostCategory, CostFrequency } from "@/generated/prisma/enums";

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
