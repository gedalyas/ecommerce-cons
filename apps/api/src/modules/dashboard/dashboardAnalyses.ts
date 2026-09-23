import type {
  DashboardChannelPoint,
  DashboardCustomerMix,
  DashboardFunnelStep,
  DashboardPaidMediaPoint,
  DashboardTopProduct,
} from "@ecommerce/contracts/dashboard";
import type { AdSpendBucket, TrafficAggregate } from "@ecommerce/contracts/marketing";
import type { OrdersBucket } from "@ecommerce/contracts/orders";
import type { ProductSales } from "@ecommerce/contracts/products";

export const TOP_PRODUCTS_LIMIT = 10;

export function channelSplitOf(
  buckets: readonly string[],
  orders: readonly OrdersBucket[],
): DashboardChannelPoint[] {
  const byBucket = new Map(orders.map((o) => [o.bucket, o]));
  return buckets.map((bucket) => {
    const o = byBucket.get(bucket);
    return {
      bucket,
      ecommerce: o?.ecommerce.revenue ?? 0,
      marketplace: o?.marketplace.revenue ?? 0,
    };
  });
}

export const topProductsOf = (
  products: readonly ProductSales[],
  limit = TOP_PRODUCTS_LIMIT,
): DashboardTopProduct[] =>
  products
    .filter((p) => p.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
    .map((p) => ({ productId: p.productId, name: p.name, revenue: p.revenue, units: p.units }));

export const customerMixOf = (customers: {
  customers: number;
  newCustomers: number;
}): DashboardCustomerMix => ({
  newCustomers: customers.newCustomers,
  returningCustomers: Math.max(0, customers.customers - customers.newCustomers),
});

export const funnelOf = (
  traffic: TrafficAggregate | null,
  paidOrders: number,
): DashboardFunnelStep[] => [
  { key: "sessions", label: "Sessões", value: traffic?.sessions ?? 0 },
  { key: "viewItem", label: "Produto visto", value: traffic?.viewItem ?? 0 },
  { key: "addToCart", label: "Carrinho", value: traffic?.addToCart ?? 0 },
  { key: "beginCheckout", label: "Checkout", value: traffic?.beginCheckout ?? 0 },
  { key: "orders", label: "Pedidos pagos", value: paidOrders },
];

export function paidMediaOf(
  rows: readonly { bucket: string; values: { totalSold: number | null } }[],
  ads: readonly AdSpendBucket[],
): DashboardPaidMediaPoint[] {
  const byBucket = new Map(ads.map((a) => [a.bucket, a]));
  return rows.map(({ bucket, values }) => ({
    bucket,
    spend: byBucket.get(bucket)?.spend ?? 0,
    revenue: values.totalSold ?? 0,
  }));
}
