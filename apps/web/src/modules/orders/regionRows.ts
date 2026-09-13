import type { RegionRow } from "@ecommerce/contracts/orders";

export type RegionSqlRow = {
  key: string;
  label: string;
  province: string;
  paid: number;
  captured: number;
  paid_orders: number;
  captured_orders: number;
  customers: number;
  items: number;
  discounts: number;
};

const ratio = (numerator: number, denominator: number) =>
  denominator > 0 ? numerator / denominator : null;

export function toRegionRows(rows: RegionSqlRow[]): RegionRow[] {
  const totalPaid = rows.reduce((s, r) => s + r.paid, 0);
  return rows.map((r) => ({
    key: r.key,
    label: r.label,
    province: r.province,
    paid: r.paid,
    paidShare: totalPaid > 0 ? (r.paid / totalPaid) * 100 : 0,
    captured: r.captured,
    approvalRate: ratio(r.paid_orders, r.captured_orders),
    paidOrders: r.paid_orders,
    capturedOrders: r.captured_orders,
    averageTicket: ratio(r.paid, r.paid_orders),
    customers: r.customers,
    items: r.items,
    itemsPerOrder: ratio(r.items, r.paid_orders),
    discounts: r.discounts,
    discountPerOrder: ratio(r.discounts, r.paid_orders),
  }));
}
