export const businessUnits = ["ECOMMERCE", "MARKETPLACE", "BOTH"] as const;
export type BusinessUnit = (typeof businessUnits)[number];

export const costCategories = ["COGS", "SALES_MARKETING", "OPERATIONAL"] as const;
export type CostCategory = (typeof costCategories)[number];

export const costFrequencies = [
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "YEARLY",
  "ONE_TIME",
  "PER_ORDER",
  "PERCENT_PER_ORDER",
  "PERCENT_OF_AD_SPEND",
] as const;
export type CostFrequency = (typeof costFrequencies)[number];
