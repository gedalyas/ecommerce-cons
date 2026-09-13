/**
 * Orders orchestrator: the only file of the module that touches Prisma.
 * Every function takes a client id and a half-open window and returns plain
 * numbers; the screens' shapes are assembled by their own services. Server-only.
 */
import { Prisma } from "@/generated/prisma/client";
import type { SalesPlatform } from "@/generated/prisma/enums";
import { prismaClient } from "@/shared/dependencies/prismaClient";
import type { BreakdownSlice } from "@/shared/models/types/metric.types";
import { isoDay, type Window } from "@/shared/utils/periodWindow";
import type { OrdersAggregate, OrdersBucket } from "./orders.types";

/** SQL fragment restricting to one sales platform, or nothing for all. */
const platformFilter = (platform: SalesPlatform | null) =>
  platform ? Prisma.sql`and sales_platform = ${platform}::sales_platform` : Prisma.empty;

type AggregateRow = {
  revenue: number;
  orders: number;
  captured: number;
  captured_orders: number;
  repeat_orders: number;
  ecommerce_orders: number;
  ecommerce_revenue: number;
  marketplace_orders: number;
  marketplace_revenue: number;
};

const toAggregate = (r: AggregateRow | undefined, cogs: number): OrdersAggregate => ({
  revenue: r?.revenue ?? 0,
  orders: r?.orders ?? 0,
  captured: r?.captured ?? 0,
  capturedOrders: r?.captured_orders ?? 0,
  cogs,
  repeatOrders: r?.repeat_orders ?? 0,
  ecommerce: { orders: r?.ecommerce_orders ?? 0, revenue: r?.ecommerce_revenue ?? 0 },
  marketplace: { orders: r?.marketplace_orders ?? 0, revenue: r?.marketplace_revenue ?? 0 },
});

const aggregateColumns = Prisma.sql`
  coalesce(sum(total_price) filter (where financial_status = 'PAID'), 0)::float8 as revenue,
  count(*) filter (where financial_status = 'PAID')::int as orders,
  coalesce(sum(total_price), 0)::float8 as captured,
  count(*)::int as captured_orders,
  count(*) filter (where financial_status = 'PAID' and order_number_for_customer >= 2)::int as repeat_orders,
  count(*) filter (where financial_status = 'PAID' and sales_platform = 'ECOMMERCE')::int as ecommerce_orders,
  coalesce(sum(total_price) filter (where financial_status = 'PAID' and sales_platform = 'ECOMMERCE'), 0)::float8 as ecommerce_revenue,
  count(*) filter (where financial_status = 'PAID' and sales_platform = 'MARKETPLACE')::int as marketplace_orders,
  coalesce(sum(total_price) filter (where financial_status = 'PAID' and sales_platform = 'MARKETPLACE'), 0)::float8 as marketplace_revenue
`;

export async function ordersAggregate(
  clientId: string,
  w: Window,
  platform: SalesPlatform | null,
): Promise<OrdersAggregate> {
  const [rows, cogs] = await Promise.all([
    prismaClient.$queryRaw<AggregateRow[]>`
      select ${aggregateColumns}
      from sales_order
      where client_id = ${clientId} and placed_at >= ${w.start} and placed_at < ${w.end}
        ${platformFilter(platform)}
    `,
    prismaClient.$queryRaw<{ cogs: number }[]>`
      select coalesce(sum(i.quantity * i.unit_cost), 0)::float8 as cogs
      from order_item i
      join sales_order o on o.id = i.order_id
      where o.client_id = ${clientId} and o.financial_status = 'PAID'
        and o.placed_at >= ${w.start} and o.placed_at < ${w.end}
        ${platformFilter(platform)}
    `,
  ]);
  return toAggregate(rows[0], cogs[0]?.cogs ?? 0);
}

export async function ordersByBucket(
  clientId: string,
  w: Window,
  unit: string,
  platform: SalesPlatform | null,
): Promise<OrdersBucket[]> {
  const [rows, cogsRows] = await Promise.all([
    prismaClient.$queryRaw<(AggregateRow & { bucket: Date })[]>`
      select date_trunc(${unit}, placed_at) as bucket, ${aggregateColumns}
      from sales_order
      where client_id = ${clientId} and placed_at >= ${w.start} and placed_at < ${w.end}
        ${platformFilter(platform)}
      group by 1
      order by 1
    `,
    prismaClient.$queryRaw<{ bucket: Date; cogs: number }[]>`
      select date_trunc(${unit}, o.placed_at) as bucket,
        coalesce(sum(i.quantity * i.unit_cost), 0)::float8 as cogs
      from order_item i
      join sales_order o on o.id = i.order_id
      where o.client_id = ${clientId} and o.financial_status = 'PAID'
        and o.placed_at >= ${w.start} and o.placed_at < ${w.end}
        ${platformFilter(platform)}
      group by 1
    `,
  ]);
  const cogsByBucket = new Map(cogsRows.map((r) => [isoDay(r.bucket), r.cogs]));
  return rows.map((r) => {
    const bucket = isoDay(r.bucket);
    return { bucket, ...toAggregate(r, cogsByBucket.get(bucket) ?? 0) };
  });
}

/** Paid revenue by traffic source: UTM source/medium for the store, channel name for marketplaces. */
export async function revenueBySource(
  clientId: string,
  w: Window,
  platform: SalesPlatform | null,
): Promise<BreakdownSlice[]> {
  const rows = await prismaClient.$queryRaw<{ source: string; value: number }[]>`
    select
      case when sales_platform = 'MARKETPLACE' then channel
           else coalesce(utm_source, '(direct)') || ' / ' || coalesce(utm_medium, '(none)') end as source,
      coalesce(sum(total_price), 0)::float8 as value
    from sales_order
    where client_id = ${clientId} and financial_status = 'PAID'
      and placed_at >= ${w.start} and placed_at < ${w.end}
      ${platformFilter(platform)}
    group by 1
    order by 2 desc
  `;
  const total = rows.reduce((s, r) => s + r.value, 0);
  return rows.map((r) => ({
    key: r.source,
    label: r.source,
    value: r.value,
    share: total > 0 ? (r.value / total) * 100 : 0,
  }));
}
