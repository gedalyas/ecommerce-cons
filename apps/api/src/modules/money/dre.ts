import type { CostTotals, DreIndicatorKey, DreLineKey } from "@ecommerce/contracts/money";

export type DreFacts = {
  revenue: number;
  productRevenue: number;
  discounts: number;
  shipping: number;
  orders: number;
  cogs: number | null;
  adSpend: number;
  adPlatformFee: number;
  costs: CostTotals;
};

export type DreLines = Record<DreLineKey, number | null>;

const minus = (a: number | null, b: number) => (a === null ? null : a - b);

export function computeDre(f: DreFacts): DreLines {
  const productRevenue = f.productRevenue - f.discounts;
  const sellingCosts = f.costs.cogs;
  const totalCosts = f.cogs === null ? null : f.cogs + sellingCosts;
  const grossProfit = totalCosts === null ? null : f.revenue - totalCosts;
  const marketingExpenses = f.adSpend + f.adPlatformFee + f.costs.salesMarketing;
  const contributionMargin = minus(grossProfit, marketingExpenses);
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
    netProfit: minus(contributionMargin, operatingExpenses),
  };
}

const pct = (numerator: number | null, denominator: number | null) =>
  numerator !== null && denominator !== null && denominator > 0
    ? (numerator / denominator) * 100
    : null;

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
