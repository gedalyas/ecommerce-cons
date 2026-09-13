import type { CostTotals, DreIndicatorKey, DreLineKey } from "@ecommerce/contracts/money";

/** What one window (or bucket) contributes to the DRE, already summed. */
export type DreFacts = {
  revenue: number;
  productRevenue: number;
  discounts: number;
  shipping: number;
  orders: number;
  cogs: number;
  adSpend: number;
  adPlatformFee: number;
  costs: CostTotals;
};

export type DreLines = Record<DreLineKey, number>;

/** The managerial income statement, line by line. */
export function computeDre(f: DreFacts): DreLines {
  const productRevenue = f.productRevenue - f.discounts;
  const sellingCosts = f.costs.cogs;
  const totalCosts = f.cogs + sellingCosts;
  const grossProfit = f.revenue - totalCosts;
  const marketingExpenses = f.adSpend + f.adPlatformFee + f.costs.salesMarketing;
  const contributionMargin = grossProfit - marketingExpenses;
  const operatingExpenses = f.costs.operational;
  return {
    revenue: f.revenue,
    productRevenue,
    shippingRevenue: f.shipping,
    totalCosts,
    cogs: f.cogs,
    sellingCosts,
    grossProfit,
    marketingExpenses,
    contributionMargin,
    operatingExpenses,
    netProfit: contributionMargin - operatingExpenses,
  };
}

const pct = (numerator: number, denominator: number) =>
  denominator > 0 ? (numerator / denominator) * 100 : null;

/** Ratios the Dinheiro pillars and the "Indicadores gerenciais" row show. */
export function computeDreIndicators(
  f: DreFacts,
  lines: DreLines,
  shippingCost: number,
): Record<DreIndicatorKey, number | null> {
  return {
    grossMargin: pct(lines.grossProfit, lines.revenue),
    contributionMarginRate: pct(lines.contributionMargin, lines.revenue),
    netMargin: pct(lines.netProfit, lines.revenue),
    cogsRate: pct(lines.cogs, lines.revenue),
    sellingCostRate: pct(lines.sellingCosts, lines.revenue),
    marketingRate: pct(lines.marketingExpenses, lines.revenue),
    shippingCostPerOrder: f.orders > 0 ? shippingCost / f.orders : null,
  };
}
