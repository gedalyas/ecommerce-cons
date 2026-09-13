import type { OrdersAggregate, OrdersSummaryKey } from "@ecommerce/contracts/orders";

export type OrdersSummaryValues = Record<OrdersSummaryKey, number | null>;

const ratio = (numerator: number, denominator: number) =>
  denominator > 0 ? numerator / denominator : null;

/** The nine Pedidos › Resumo indicators from one aggregate (window or bucket). */
export function computeOrdersSummary(a: OrdersAggregate): OrdersSummaryValues {
  const approval = ratio(a.revenue, a.captured);
  return {
    captured: a.captured,
    revenue: a.revenue,
    approvalRate: approval == null ? null : approval * 100,
    orders: a.orders,
    averageTicket: ratio(a.revenue, a.orders),
    itemsPerOrder: ratio(a.items, a.orders),
    discounts: a.discounts,
    discountPerOrder: ratio(a.discounts, a.orders),
    shipping: a.shipping,
  };
}
