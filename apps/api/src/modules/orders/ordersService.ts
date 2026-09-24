import { Prisma, prismaClient } from "@ecommerce/database/client";
import type { SalesPlatform } from "@ecommerce/database/enums";
import type { ChannelSales } from "@ecommerce/contracts/marketing";
import type { BreakdownSlice } from "@ecommerce/contracts/shared/metric.types";
import { isoDay, type Window } from "@ecommerce/contracts/shared/periodWindow";
import type { OrdersAggregate, OrdersBucket, OrdersFilters } from "@ecommerce/contracts/orders";

export const platformFilter = (platform: SalesPlatform | null) =>
  platform ? Prisma.sql`and o.sales_platform = ${platform}::sales_platform` : Prisma.empty;

export const sourceExpression = Prisma.sql`
  case when o.sales_platform = 'MARKETPLACE' then o.channel
       else coalesce(o.utm_source, '(direct)') || ' / ' || coalesce(o.utm_medium, '(none)') end`;

const inList = (column: Prisma.Sql, values: string[]) =>
  values.length ? Prisma.sql`and ${column} = any(${values}::text[])` : Prisma.empty;

export const rowFilters = (filters: OrdersFilters | null) => {
  if (!filters) return Prisma.empty;
  return Prisma.sql`
    ${inList(Prisma.sql`(${sourceExpression})`, filters.origem)}
    ${inList(Prisma.sql`o.financial_status::text`, filters.status)}
    ${inList(Prisma.sql`o.payment_gateway`, filters.gateway)}
    ${inList(Prisma.sql`o.processing_method::text`, filters.metodo)}
    ${filters.cupom.length ? Prisma.sql`and o.discount_codes && ${filters.cupom}::text[]` : Prisma.empty}
    ${inList(Prisma.sql`o.province`, filters.uf)}
    ${inList(Prisma.sql`o.city`, filters.cidade)}
  `;
};

export const ordersWhere = (
  clientId: string,
  w: Window,
  platform: SalesPlatform | null,
  filters: OrdersFilters | null,
) => Prisma.sql`
  o.client_id = ${clientId} and o.placed_at >= ${w.start} and o.placed_at < ${w.end}
  ${platformFilter(platform)}
  ${rowFilters(filters)}
`;

type AggregateRow = {
  revenue: number;
  orders: number;
  captured: number;
  captured_orders: number;
  repeat_orders: number;
  product_revenue: number;
  items: number;
  discounts: number;
  shipping: number;
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
  productRevenue: r?.product_revenue ?? 0,
  items: r?.items ?? 0,
  discounts: r?.discounts ?? 0,
  shipping: r?.shipping ?? 0,
  ecommerce: { orders: r?.ecommerce_orders ?? 0, revenue: r?.ecommerce_revenue ?? 0 },
  marketplace: { orders: r?.marketplace_orders ?? 0, revenue: r?.marketplace_revenue ?? 0 },
});

const aggregateColumns = Prisma.sql`
  coalesce(sum(o.total_price) filter (where o.financial_status = 'PAID'), 0)::float8 as revenue,
  count(*) filter (where o.financial_status = 'PAID')::int as orders,
  coalesce(sum(o.total_price), 0)::float8 as captured,
  count(*)::int as captured_orders,
  count(*) filter (where o.financial_status = 'PAID' and o.order_number_for_customer >= 2)::int as repeat_orders,
  coalesce(sum(o.product_revenue) filter (where o.financial_status = 'PAID'), 0)::float8 as product_revenue,
  coalesce(sum(o.items_count) filter (where o.financial_status = 'PAID'), 0)::int as items,
  coalesce(sum(o.total_discounts) filter (where o.financial_status = 'PAID'), 0)::float8 as discounts,
  coalesce(sum(o.shipping_revenue) filter (where o.financial_status = 'PAID'), 0)::float8 as shipping,
  count(*) filter (where o.financial_status = 'PAID' and o.sales_platform = 'ECOMMERCE')::int as ecommerce_orders,
  coalesce(sum(o.total_price) filter (where o.financial_status = 'PAID' and o.sales_platform = 'ECOMMERCE'), 0)::float8 as ecommerce_revenue,
  count(*) filter (where o.financial_status = 'PAID' and o.sales_platform = 'MARKETPLACE')::int as marketplace_orders,
  coalesce(sum(o.total_price) filter (where o.financial_status = 'PAID' and o.sales_platform = 'MARKETPLACE'), 0)::float8 as marketplace_revenue
`;

export async function ordersAggregate(
  clientId: string,
  w: Window,
  platform: SalesPlatform | null,
  filters: OrdersFilters | null = null,
): Promise<OrdersAggregate> {
  const where = ordersWhere(clientId, w, platform, filters);
  const [rows, cogs] = await Promise.all([
    prismaClient.$queryRaw<AggregateRow[]>`
      select ${aggregateColumns} from sales_order o where ${where}
    `,
    prismaClient.$queryRaw<{ cogs: number }[]>`
      select coalesce(sum(i.quantity * i.unit_cost), 0)::float8 as cogs
      from order_item i
      join sales_order o on o.id = i.order_id
      where ${where} and o.financial_status = 'PAID'
    `,
  ]);
  return toAggregate(rows[0], cogs[0]?.cogs ?? 0);
}

export async function ordersByBucket(
  clientId: string,
  w: Window,
  unit: string,
  platform: SalesPlatform | null,
  filters: OrdersFilters | null = null,
): Promise<OrdersBucket[]> {
  const where = ordersWhere(clientId, w, platform, filters);
  const [rows, cogsRows] = await Promise.all([
    prismaClient.$queryRaw<(AggregateRow & { bucket: Date })[]>`
      select date_trunc(${unit}, o.placed_at) as bucket, ${aggregateColumns}
      from sales_order o
      where ${where}
      group by 1
      order by 1
    `,
    prismaClient.$queryRaw<{ bucket: Date; cogs: number }[]>`
      select date_trunc(${unit}, o.placed_at) as bucket,
        coalesce(sum(i.quantity * i.unit_cost), 0)::float8 as cogs
      from order_item i
      join sales_order o on o.id = i.order_id
      where ${where} and o.financial_status = 'PAID'
      group by 1
    `,
  ]);
  const cogsByBucket = new Map(cogsRows.map((r) => [isoDay(r.bucket), r.cogs]));
  return rows.map((r) => {
    const bucket = isoDay(r.bucket);
    return { bucket, ...toAggregate(r, cogsByBucket.get(bucket) ?? 0) };
  });
}

export async function salesByChannel(clientId: string, w: Window): Promise<ChannelSales[]> {
  const rows = await prismaClient.$queryRaw<ChannelSales[]>`
    select o.sales_platform = 'MARKETPLACE' as marketplace, o.channel,
      coalesce(sum(o.total_price), 0)::float8 as revenue, count(*)::int as orders
    from sales_order o
    where ${ordersWhere(clientId, w, null, null)} and o.financial_status = 'PAID'
    group by 1, 2
  `;
  return rows;
}

export async function revenueBySource(
  clientId: string,
  w: Window,
  platform: SalesPlatform | null,
): Promise<BreakdownSlice[]> {
  const rows = await prismaClient.$queryRaw<{ source: string; value: number }[]>`
    select ${sourceExpression} as source, coalesce(sum(o.total_price), 0)::float8 as value
    from sales_order o
    where ${ordersWhere(clientId, w, platform, null)} and o.financial_status = 'PAID'
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
