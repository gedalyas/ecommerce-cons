import type { CostActivity, CostRule, CostTotals } from "./money.types";

const DAY = 86_400_000;
const AVERAGE_MONTH_DAYS = 365.25 / 12;
const AVERAGE_YEAR_DAYS = 365.25;

/** Calendar window as ISO dates, `fim` inclusive. */
export type CostWindow = { inicio: string; fim: string };

const dayIndex = (iso: string) => Math.round(new Date(`${iso}T00:00:00.000Z`).getTime() / DAY);

/** Inclusive number of days the rule is active inside the window. */
export function activeDays(rule: Pick<CostRule, "startDate" | "endDate">, window: CostWindow) {
  const start = Math.max(dayIndex(rule.startDate), dayIndex(window.inicio));
  const end = Math.min(rule.endDate ? dayIndex(rule.endDate) : Infinity, dayIndex(window.fim));
  return Math.max(0, end - start + 1);
}

function activityFor(rule: CostRule, activity: CostActivity) {
  switch (rule.businessUnit) {
    case "ECOMMERCE":
      return activity.ecommerce;
    case "MARKETPLACE":
      return activity.marketplace;
    case "BOTH":
      return {
        orders: activity.ecommerce.orders + activity.marketplace.orders,
        revenue: activity.ecommerce.revenue + activity.marketplace.revenue,
      };
  }
}

/** Amount a single rule accrues over the window, given the activity in it. */
export function ruleAmount(rule: CostRule, window: CostWindow, activity: CostActivity): number {
  const days = activeDays(rule, window);
  if (days === 0) return 0;
  const unit = activityFor(rule, activity);
  switch (rule.frequency) {
    case "DAILY":
      return rule.value * days;
    case "WEEKLY":
      return (rule.value * days) / 7;
    case "MONTHLY":
      return (rule.value * days) / AVERAGE_MONTH_DAYS;
    case "YEARLY":
      return (rule.value * days) / AVERAGE_YEAR_DAYS;
    case "ONE_TIME": {
      const start = dayIndex(rule.startDate);
      return start >= dayIndex(window.inicio) && start <= dayIndex(window.fim) ? rule.value : 0;
    }
    case "PER_ORDER":
      return rule.value * unit.orders;
    case "PERCENT_PER_ORDER":
      return (rule.value / 100) * unit.revenue;
    case "PERCENT_OF_AD_SPEND":
      return (rule.value / 100) * activity.adSpend;
  }
}

/** Sums every rule over the window into the three DRE lines. */
export function expandCosts(
  rules: readonly CostRule[],
  window: CostWindow,
  activity: CostActivity,
): CostTotals {
  const totals = { cogs: 0, salesMarketing: 0, operational: 0 };
  for (const rule of rules) {
    const amount = ruleAmount(rule, window, activity);
    if (rule.category === "COGS") totals.cogs += amount;
    else if (rule.category === "SALES_MARKETING") totals.salesMarketing += amount;
    else totals.operational += amount;
  }
  return { ...totals, total: totals.cogs + totals.salesMarketing + totals.operational };
}
