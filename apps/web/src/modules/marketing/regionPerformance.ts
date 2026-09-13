import type { AdPlatform } from "@ecommerce/database/enums";
import type { RegionPerformanceRow } from "@ecommerce/contracts/marketing";
import { platformFeeRate } from "@ecommerce/contracts/marketing";

export type RegionSpendRow = {
  province: string;
  platform: AdPlatform;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
};

export type RegionSalesRow = {
  province: string;
  revenue: number;
  orders: number;
  customers: number;
  repeat_orders: number;
  new_customers: number;
};

const ratio = (numerator: number, denominator: number) =>
  denominator > 0 ? numerator / denominator : null;

type Sums = RegionPerformanceRow;

const emptyRow = (province: string): Sums => ({
  province,
  metaSpend: 0,
  googleSpend: 0,
  tiktokSpend: 0,
  totalSpend: 0,
  revenue: 0,
  roas: null,
  cpm: null,
  cpc: null,
  cpa: null,
  cac: null,
  customers: 0,
  averageTicket: null,
  repurchaseRate: null,
  impressions: 0,
  clicks: 0,
  orders: 0,
  newCustomers: 0,
  repeatOrders: 0,
});

export function regionRows(
  spend: RegionSpendRow[],
  sales: RegionSalesRow[],
  includeFee: boolean,
): RegionPerformanceRow[] {
  const rows = new Map<string, Sums>();
  const rowOf = (province: string) => {
    const row = rows.get(province) ?? emptyRow(province);
    rows.set(province, row);
    return row;
  };
  const feeFactor = includeFee ? 1 + platformFeeRate : 1;
  for (const s of spend) {
    const row = rowOf(s.province);
    const amount = s.spend * feeFactor;
    if (s.platform === "META") row.metaSpend += amount;
    else if (s.platform === "GOOGLE") row.googleSpend += amount;
    else row.tiktokSpend += amount;
    row.totalSpend += amount;
    row.impressions += s.impressions;
    row.clicks += s.clicks;
  }
  for (const s of sales) {
    const row = rowOf(s.province);
    row.revenue += s.revenue;
    row.orders += s.orders;
    row.customers += s.customers;
    row.newCustomers += s.new_customers;
    row.repeatOrders += s.repeat_orders;
  }
  return [...rows.values()].map(withRatios).sort((a, b) => b.revenue - a.revenue);
}

export const withRatios = (r: Sums): RegionPerformanceRow => ({
  ...r,
  roas: ratio(r.revenue, r.totalSpend),
  cpm: r.impressions > 0 ? (r.totalSpend / r.impressions) * 1000 : null,
  cpc: ratio(r.totalSpend, r.clicks),
  cpa: ratio(r.totalSpend, r.orders),
  cac: ratio(r.totalSpend, r.newCustomers),
  averageTicket: ratio(r.revenue, r.orders),
  repurchaseRate: r.orders > 0 ? (r.repeatOrders / r.orders) * 100 : null,
});

const additiveKeys = [
  "metaSpend",
  "googleSpend",
  "tiktokSpend",
  "totalSpend",
  "revenue",
  "customers",
  "impressions",
  "clicks",
  "orders",
  "newCustomers",
  "repeatOrders",
] as const;

export function totalOf(rows: RegionPerformanceRow[]): RegionPerformanceRow {
  const total = emptyRow("Total");
  for (const r of rows) for (const k of additiveKeys) total[k] += r[k];
  return withRatios(total);
}
