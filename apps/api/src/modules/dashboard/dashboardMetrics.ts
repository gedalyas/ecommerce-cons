import { cacPercent } from "@ecommerce/contracts/marketing";
import type { CostTotals } from "@ecommerce/contracts/money";
import type { Channel } from "@ecommerce/contracts/shared/period";
import type { DashboardMetricKey } from "@ecommerce/contracts/dashboard";

export type DashboardFacts = {
  revenue: number;
  orders: number;
  ecommerceOrders: number;
  ecommerceRevenue: number;
  cogs: number;
  repeatOrders: number;
  customers: number;
  newCustomers: number;
  sessions: number;
  adSpend: number;
  adPlatformFee: number;
  costs: CostTotals;
};

export type DashboardValues = Record<DashboardMetricKey, number | null>;

const ratio = (numerator: number, denominator: number) =>
  denominator > 0 ? numerator / denominator : null;

export function computeDashboardMetrics(facts: DashboardFacts, channel: Channel): DashboardValues {
  const investment = facts.adSpend + facts.adPlatformFee + facts.costs.salesMarketing;
  const goodsAndFees = facts.cogs + facts.costs.cogs;
  const contribution = facts.revenue - goodsAndFees - investment;
  const paidMediaApplies = channel !== "marketplace";

  return {
    totalSold: facts.revenue,
    orders: facts.orders,
    averageTicket: ratio(facts.revenue, facts.orders),
    conversionRate: paidMediaApplies ? percent(facts.ecommerceOrders, facts.sessions) : null,
    marketingInvestment: investment,
    roi: paidMediaApplies ? ratio(facts.revenue - investment, investment) : null,
    roas: paidMediaApplies ? ratio(facts.revenue, facts.adSpend + facts.adPlatformFee) : null,
    mer: paidMediaApplies ? ratio(facts.revenue, investment) : null,
    cac: paidMediaApplies ? cacPercent(investment, facts.revenue) : null,
    cpa: paidMediaApplies ? ratio(investment, facts.orders) : null,
    netProfit: contribution - facts.costs.operational,
    customers: facts.customers,
    contributionMargin: percent(contribution, facts.revenue),
    repurchaseRate: percent(facts.repeatOrders, facts.orders),
  };
}

const percent = (numerator: number, denominator: number) => {
  const r = ratio(numerator, denominator);
  return r == null ? null : r * 100;
};
