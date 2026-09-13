import type { InfluencerActivity, InfluencerRule } from "@ecommerce/contracts/influencers";

const DAY = 86_400_000;
const AVERAGE_MONTH_DAYS = 365.25 / 12;

export type CostWindow = { inicio: string; fim: string };

const dayIndex = (iso: string) => Math.round(new Date(`${iso}T00:00:00.000Z`).getTime() / DAY);

export function activeDays(rule: Pick<InfluencerRule, "startDate" | "endDate">, w: CostWindow) {
  const start = Math.max(dayIndex(rule.startDate), dayIndex(w.inicio));
  const end = Math.min(rule.endDate ? dayIndex(rule.endDate) : Infinity, dayIndex(w.fim));
  return Math.max(0, end - start + 1);
}

const rawAmount = (rule: InfluencerRule, days: number, w: CostWindow, a: InfluencerActivity) => {
  switch (rule.type) {
    case "FIXED": {
      const start = dayIndex(rule.startDate);
      return start >= dayIndex(w.inicio) && start <= dayIndex(w.fim) ? rule.value : 0;
    }
    case "DAILY":
      return rule.value * days;
    case "WEEKLY":
      return (rule.value * days) / 7;
    case "MONTHLY":
      return (rule.value * days) / AVERAGE_MONTH_DAYS;
    case "PER_ORDER":
      return rule.value * a.orders;
    case "PERCENT_OF_PRODUCTS":
      return (rule.value / 100) * a.productRevenue;
    case "PERCENT_OF_TOTAL":
      return (rule.value / 100) * a.revenue;
  }
};

export function ruleCost(rule: InfluencerRule, w: CostWindow, activity: InfluencerActivity) {
  const days = activeDays(rule, w);
  if (days === 0) return 0;
  const amount = rawAmount(rule, days, w, activity);
  return rule.cap == null ? amount : Math.min(amount, rule.cap);
}

export const influencerCost = (
  rules: readonly InfluencerRule[],
  w: CostWindow,
  activity: InfluencerActivity,
) => rules.reduce((sum, rule) => sum + ruleCost(rule, w, activity), 0);

export const roiOf = (revenue: number, cost: number) =>
  cost > 0 ? ((revenue - cost) / cost) * 100 : null;

export const repurchaseRateOf = (a: InfluencerActivity) =>
  a.orders > 0 ? (a.repeatOrders / a.orders) * 100 : null;

export const emptyActivity: InfluencerActivity = {
  orders: 0,
  revenue: 0,
  productRevenue: 0,
  shippingRevenue: 0,
  customers: 0,
  newCustomers: 0,
  repeatOrders: 0,
};

export function sumActivity(items: readonly InfluencerActivity[]): InfluencerActivity {
  return items.reduce(
    (t, a) => ({
      orders: t.orders + a.orders,
      revenue: t.revenue + a.revenue,
      productRevenue: t.productRevenue + a.productRevenue,
      shippingRevenue: t.shippingRevenue + a.shippingRevenue,
      customers: t.customers + a.customers,
      newCustomers: t.newCustomers + a.newCustomers,
      repeatOrders: t.repeatOrders + a.repeatOrders,
    }),
    emptyActivity,
  );
}
