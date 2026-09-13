import type { CostTotals } from "@/modules/money/contract";
import type { Channel } from "@/shared/utils/period";
import type { DashboardMetricKey } from "./dashboard.types";

/** Everything the metrics need for one window or one bucket, already summed. */
export type DashboardFacts = {
  revenue: number;
  orders: number;
  ecommerceOrders: number;
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

/**
 * The ten Painel de Controle metrics plus the two headline extras, derived
 * from the facts of a window. Marketplaces have no sessions and no ad spend,
 * so conversion, CAC, CPA and ROI are undefined for that channel alone.
 */
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
    cac: paidMediaApplies ? ratio(investment, facts.newCustomers) : null,
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
