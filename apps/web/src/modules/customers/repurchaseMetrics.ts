/** Pure derivations for Recompra and LTV/CAC. */

export type RepurchaseFacts = {
  revenue: number;
  repeatRevenue: number;
  orders: number;
  repeatOrders: number;
  customers: number;
  repeatCustomers: number;
  /** Lifetime paid orders per buyer, across the whole base. */
  lifetimeFrequency: number | null;
};

export type RepurchaseValues = {
  revenue: number;
  repeatRevenue: number;
  repeatRevenueRate: number | null;
  orders: number;
  repeatOrders: number;
  repeatOrderRate: number | null;
  customers: number;
  repeatCustomers: number;
  repeatCustomerRate: number | null;
  frequency: number | null;
};

const percent = (numerator: number, denominator: number) =>
  denominator > 0 ? (numerator / denominator) * 100 : null;

export function computeRepurchase(f: RepurchaseFacts): RepurchaseValues {
  return {
    revenue: f.revenue,
    repeatRevenue: f.repeatRevenue,
    repeatRevenueRate: percent(f.repeatRevenue, f.revenue),
    orders: f.orders,
    repeatOrders: f.repeatOrders,
    repeatOrderRate: percent(f.repeatOrders, f.orders),
    customers: f.customers,
    repeatCustomers: f.repeatCustomers,
    repeatCustomerRate: percent(f.repeatCustomers, f.customers),
    frequency: f.lifetimeFrequency,
  };
}

export type LtvCacFacts = {
  revenue: number;
  orders: number;
  newCustomers: number;
  marketingInvestment: number;
  /** Lifetime paid orders per buyer. */
  lifetimeFrequency: number | null;
};

export type LtvCacValues = {
  averageTicket: number | null;
  ltv: number | null;
  cac: number | null;
  cpa: number | null;
  ltvCacRatio: number | null;
};

/** LTV = ticket médio × frequência de compra; CAC = investimento ÷ novos clientes. */
export function computeLtvCac(f: LtvCacFacts): LtvCacValues {
  const averageTicket = f.orders > 0 ? f.revenue / f.orders : null;
  const ltv =
    averageTicket != null && f.lifetimeFrequency != null
      ? averageTicket * f.lifetimeFrequency
      : null;
  const cac = f.newCustomers > 0 ? f.marketingInvestment / f.newCustomers : null;
  return {
    averageTicket,
    ltv,
    cac,
    cpa: f.orders > 0 ? f.marketingInvestment / f.orders : null,
    ltvCacRatio: ltv != null && cac != null && cac > 0 ? ltv / cac : null,
  };
}

/** Customers with at least n+1 orders over customers with at least n, for n = 1..6. */
export function retentionByOrderNumber(
  customersByOrders: readonly { orders: number; customers: number }[],
): { orderNumber: number; customers: number; rate: number | null }[] {
  const atLeast = (n: number) =>
    customersByOrders.filter((c) => c.orders >= n).reduce((s, c) => s + c.customers, 0);
  return [1, 2, 3, 4, 5, 6].map((n) => {
    const base = atLeast(n);
    const next = atLeast(n + 1);
    return { orderNumber: n, customers: base, rate: base > 0 ? (next / base) * 100 : null };
  });
}
