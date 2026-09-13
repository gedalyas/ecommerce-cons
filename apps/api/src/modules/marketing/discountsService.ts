import type { SalesPlatform } from "@ecommerce/database/enums";
import { prismaClient } from "@ecommerce/database/client";
import { isoDay, type Window } from "@ecommerce/contracts/shared/periodWindow";
import { platformFilter } from "./attributionService";
import type { DiscountCodeRow } from "@ecommerce/contracts/marketing";
import type { DiscountFacts } from "./marketingMetrics";

type FactsRow = {
  orders: number;
  revenue: number;
  coupon_orders: number;
  coupon_revenue: number;
  discounts: number;
};

const toFacts = (r: FactsRow | undefined): DiscountFacts => ({
  orders: r?.orders ?? 0,
  revenue: r?.revenue ?? 0,
  couponOrders: r?.coupon_orders ?? 0,
  couponRevenue: r?.coupon_revenue ?? 0,
  discounts: r?.discounts ?? 0,
});

export async function discountAggregate(
  clientId: string,
  w: Window,
  platform: SalesPlatform | null,
): Promise<DiscountFacts> {
  const rows = await prismaClient.$queryRaw<FactsRow[]>`
    select count(*)::int as orders,
      coalesce(sum(o.total_price), 0)::float8 as revenue,
      count(*) filter (where cardinality(o.discount_codes) > 0)::int as coupon_orders,
      coalesce(sum(o.total_price) filter (where cardinality(o.discount_codes) > 0), 0)::float8 as coupon_revenue,
      coalesce(sum(o.total_discounts), 0)::float8 as discounts
    from sales_order o
    where o.client_id = ${clientId} and o.financial_status = 'PAID'
      and o.placed_at >= ${w.start} and o.placed_at < ${w.end}
      ${platformFilter(platform)}
  `;
  return toFacts(rows[0]);
}

export async function discountsByBucket(
  clientId: string,
  w: Window,
  unit: string,
  platform: SalesPlatform | null,
): Promise<(DiscountFacts & { bucket: string })[]> {
  const rows = await prismaClient.$queryRaw<(FactsRow & { bucket: Date })[]>`
    select date_trunc(${unit}, o.placed_at) as bucket,
      count(*)::int as orders,
      coalesce(sum(o.total_price), 0)::float8 as revenue,
      count(*) filter (where cardinality(o.discount_codes) > 0)::int as coupon_orders,
      coalesce(sum(o.total_price) filter (where cardinality(o.discount_codes) > 0), 0)::float8 as coupon_revenue,
      coalesce(sum(o.total_discounts), 0)::float8 as discounts
    from sales_order o
    where o.client_id = ${clientId} and o.financial_status = 'PAID'
      and o.placed_at >= ${w.start} and o.placed_at < ${w.end}
      ${platformFilter(platform)}
    group by 1
    order by 1
  `;
  return rows.map((r) => ({ bucket: isoDay(r.bucket), ...toFacts(r) }));
}

/** One row per coupon code used on paid orders in the window. */
export async function discountCodes(
  clientId: string,
  w: Window,
  platform: SalesPlatform | null,
): Promise<DiscountCodeRow[]> {
  const rows = await prismaClient.$queryRaw<
    {
      code: string;
      orders: number;
      revenue: number;
      discounts: number;
      first_orders: number;
    }[]
  >`
    select code, count(*)::int as orders,
      coalesce(sum(o.total_price), 0)::float8 as revenue,
      coalesce(sum(o.total_discounts), 0)::float8 as discounts,
      count(*) filter (where o.order_number_for_customer = 1)::int as first_orders
    from sales_order o, unnest(o.discount_codes) as code
    where o.client_id = ${clientId} and o.financial_status = 'PAID'
      and o.placed_at >= ${w.start} and o.placed_at < ${w.end}
      ${platformFilter(platform)}
    group by 1
    order by revenue desc
  `;
  return rows.map((r) => ({
    code: r.code,
    orders: r.orders,
    revenue: r.revenue,
    discounts: r.discounts,
    discountRate:
      r.revenue + r.discounts > 0 ? (r.discounts / (r.revenue + r.discounts)) * 100 : null,
    aov: r.orders > 0 ? r.revenue / r.orders : 0,
    firstOrders: r.first_orders,
  }));
}
