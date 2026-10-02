import { Prisma, prismaClient } from "@ecommerce/database/client";
import type { SalesPlatform } from "@ecommerce/database/enums";
import type { BreakdownSlice, Series } from "@ecommerce/contracts/shared/metric.types";
import { metricValue } from "@ecommerce/contracts/shared/metricValue";
import type { Channel, PeriodSearch } from "@ecommerce/contracts/shared/period";
import {
  fillSeries,
  resolvePeriod,
  truncUnit,
  type Window,
} from "@ecommerce/contracts/shared/periodWindow";
import type {
  ApprovalDimensionKey,
  ApprovalRow,
  OrdersApproval,
  OrdersFilterOptions,
  OrdersFilters,
  OrdersListPage,
  OrdersListRow,
  OrdersScreen,
  OrdersSourceRow,
  OrdersSummary,
  OrdersSummaryMetric,
  OrdersSearch,
  OrdersSortField,
} from "@ecommerce/contracts/orders";
import {
  ordersSummaryKeys,
  financialStatusLabel,
  labelFor,
  processingMethodLabel,
} from "@ecommerce/contracts/orders";
import { ordersAggregate, ordersByBucket, ordersWhere, sourceExpression } from "./ordersService";
import { salesByCity, salesByProvince } from "./regionsService";
import { computeOrdersSummary, type OrdersSummaryValues } from "./ordersSummaryMetrics";

const platformFor = (channel: Channel): SalesPlatform | null =>
  channel === "ecommerce" ? "ECOMMERCE" : channel === "marketplace" ? "MARKETPLACE" : null;

const filtersOf = (s: OrdersSearch): OrdersFilters => ({
  origem: s.origem,
  status: s.status,
  gateway: s.gateway,
  metodo: s.metodo,
  cupom: s.cupom,
  uf: s.uf,
  cidade: s.cidade,
  busca: s.busca,
});

const summaryDefinitions: Omit<OrdersSummaryMetric, "metric">[] = [
  { key: "captured", label: "Receita capturada", unit: "currency", goodWhen: "up" },
  { key: "revenue", label: "Receita paga", unit: "currency", goodWhen: "up" },
  { key: "approvalRate", label: "Taxa de aprovação", unit: "percent", goodWhen: "up" },
  { key: "orders", label: "Pedidos pagos", unit: "count", goodWhen: "up" },
  { key: "averageTicket", label: "Ticket médio", unit: "currency", goodWhen: "up" },
  { key: "itemsPerOrder", label: "Itens por pedido", unit: "count", goodWhen: "up" },
  { key: "discounts", label: "Total de descontos", unit: "currency", goodWhen: "down" },
  { key: "discountPerOrder", label: "Desconto por pedido", unit: "currency", goodWhen: "down" },
  { key: "shipping", label: "Frete", unit: "currency", goodWhen: "up" },
];

async function sourceRows(
  clientId: string,
  w: Window,
  platform: SalesPlatform | null,
): Promise<OrdersSourceRow[]> {
  const rows = await prismaClient.$queryRaw<
    {
      channel: string;
      source: string;
      captured: number;
      paid: number;
      paid_orders: number;
      items: number;
      discounts: number;
    }[]
  >`
    select o.channel, ${sourceExpression} as source,
      coalesce(sum(o.total_price), 0)::float8 as captured,
      coalesce(sum(o.total_price) filter (where o.financial_status = 'PAID'), 0)::float8 as paid,
      count(*) filter (where o.financial_status = 'PAID')::int as paid_orders,
      coalesce(sum(o.items_count) filter (where o.financial_status = 'PAID'), 0)::int as items,
      coalesce(sum(o.total_discounts) filter (where o.financial_status = 'PAID'), 0)::float8 as discounts
    from sales_order o
    where ${ordersWhere(clientId, w, platform, null)}
    group by 1, 2
    order by 4 desc
  `;
  return rows.map((r) => ({
    channel: r.channel,
    source: r.source,
    captured: r.captured,
    paid: r.paid,
    approvalRate: r.captured > 0 ? (r.paid / r.captured) * 100 : null,
    paidOrders: r.paid_orders,
    averageTicket: r.paid_orders > 0 ? r.paid / r.paid_orders : null,
    items: r.items,
    discounts: r.discounts,
    discountPerOrder: r.paid_orders > 0 ? r.discounts / r.paid_orders : null,
  }));
}

export async function ordersSummary(
  clientId: string,
  search: PeriodSearch,
): Promise<OrdersSummary> {
  const period = resolvePeriod(search);
  const unit = truncUnit[period.por];
  const platform = platformFor(search.canal);
  const [current, previous, currentBuckets, previousBuckets, rows] = await Promise.all([
    ordersAggregate(clientId, period.current, platform),
    period.previous ? ordersAggregate(clientId, period.previous, platform) : null,
    ordersByBucket(clientId, period.current, unit, platform),
    period.previous ? ordersByBucket(clientId, period.previous, unit, platform) : null,
    sourceRows(clientId, period.current, platform),
  ]);

  const values = computeOrdersSummary(current);
  const previousValues = previous ? computeOrdersSummary(previous) : null;
  const toSeries = (buckets: typeof currentBuckets, w: Window, key: keyof OrdersSummaryValues) =>
    fillSeries(
      w,
      period.por,
      buckets.map((b) => ({ bucket: b.bucket, value: computeOrdersSummary(b)[key] ?? 0 })),
    );
  const series = Object.fromEntries(
    ordersSummaryKeys.map((key) => [
      key,
      {
        current: toSeries(currentBuckets, period.current, key),
        previous:
          previousBuckets && period.previous
            ? toSeries(previousBuckets, period.previous, key)
            : null,
      },
    ]),
  ) as Record<(typeof ordersSummaryKeys)[number], Series>;

  const paidTotal = rows.reduce((s, r) => s + r.paid, 0);
  const sourceSlices: BreakdownSlice[] = rows
    .filter((r) => r.paid > 0)
    .map((r) => ({
      key: r.source,
      label: r.source,
      value: r.paid,
      share: paidTotal > 0 ? (r.paid / paidTotal) * 100 : 0,
    }));

  return {
    metrics: summaryDefinitions.map((d) => ({
      ...d,
      metric: metricValue(d.unit, values[d.key], previousValues?.[d.key] ?? null),
    })),
    series,
    sourceSlices,
    bySource: rows,
  };
}

const dimensionColumn: Record<ApprovalDimensionKey, Prisma.Sql> = {
  status: Prisma.sql`o.financial_status::text`,
  metodo: Prisma.sql`o.processing_method::text`,
  gateway: Prisma.sql`o.payment_gateway`,
};

const dimensionLabel: Record<ApprovalDimensionKey, string> = {
  status: "Status de pagamento",
  metodo: "Método de pagamento",
  gateway: "Gateway de pagamento",
};

const valueLabel = (dimension: ApprovalDimensionKey, value: string) =>
  dimension === "status"
    ? labelFor(financialStatusLabel, value)
    : dimension === "metodo"
      ? labelFor(processingMethodLabel, value)
      : value;

async function approvalDimension(
  clientId: string,
  w: Window,
  platform: SalesPlatform | null,
  filters: OrdersFilters,
  dimension: ApprovalDimensionKey,
) {
  const rows = await prismaClient.$queryRaw<
    { key: string; captured: number; paid: number; orders: number; paid_orders: number }[]
  >`
    select ${dimensionColumn[dimension]} as key,
      coalesce(sum(o.total_price), 0)::float8 as captured,
      coalesce(sum(o.total_price) filter (where o.financial_status = 'PAID'), 0)::float8 as paid,
      count(*)::int as orders,
      count(*) filter (where o.financial_status = 'PAID')::int as paid_orders
    from sales_order o
    where ${ordersWhere(clientId, w, platform, filters)}
    group by 1
    order by 2 desc
  `;
  const total = rows.reduce((s, r) => s + r.captured, 0);
  const table: ApprovalRow[] = rows.map((r) => ({
    key: r.key,
    label: valueLabel(dimension, r.key),
    captured: r.captured,
    paid: r.paid,
    approvalRate: r.captured > 0 ? (r.paid / r.captured) * 100 : null,
    orders: r.orders,
    paidOrders: r.paid_orders,
  }));
  return {
    key: dimension,
    label: dimensionLabel[dimension],
    slices: table.map((r) => ({
      key: r.key,
      label: r.label,
      value: r.captured,
      share: total > 0 ? (r.captured / total) * 100 : 0,
    })),
    rows: table,
  };
}

export async function ordersApproval(
  clientId: string,
  search: PeriodSearch & OrdersSearch,
): Promise<OrdersApproval> {
  const period = resolvePeriod(search);
  const unit = truncUnit[period.por];
  const platform = platformFor(search.canal);
  const filters = filtersOf(search);
  const [currentBuckets, previousBuckets, ...dimensions] = await Promise.all([
    ordersByBucket(clientId, period.current, unit, platform, filters),
    period.previous ? ordersByBucket(clientId, period.previous, unit, platform, filters) : null,
    approvalDimension(clientId, period.current, platform, filters, "status"),
    approvalDimension(clientId, period.current, platform, filters, "metodo"),
    approvalDimension(clientId, period.current, platform, filters, "gateway"),
  ]);
  const rate = (b: { revenue: number; captured: number }) =>
    b.captured > 0 ? (b.revenue / b.captured) * 100 : 0;
  const toSeries = (buckets: typeof currentBuckets, w: Window) =>
    fillSeries(
      w,
      period.por,
      buckets.map((b) => ({ bucket: b.bucket, value: rate(b) })),
    );
  return {
    approvalSeries: {
      current: toSeries(currentBuckets, period.current),
      previous:
        previousBuckets && period.previous ? toSeries(previousBuckets, period.previous) : null,
    },
    dimensions,
  };
}

export async function ordersFilterOptions(
  clientId: string,
  search: PeriodSearch,
): Promise<OrdersFilterOptions> {
  const period = resolvePeriod(search);
  const platform = platformFor(search.canal);
  const where = ordersWhere(clientId, period.current, platform, null);
  const distinct = (expr: Prisma.Sql) =>
    prismaClient.$queryRaw<{ value: string }[]>`
      select distinct ${expr} as value from sales_order o where ${where} and ${expr} is not null order by 1
    `;
  const [origem, status, gateway, metodo, cupom, uf, cidade] = await Promise.all([
    distinct(sourceExpression),
    distinct(Prisma.sql`o.financial_status::text`),
    distinct(Prisma.sql`o.payment_gateway`),
    distinct(Prisma.sql`o.processing_method::text`),
    prismaClient.$queryRaw<{ value: string }[]>`
      select distinct unnest(o.discount_codes) as value from sales_order o where ${where} order by 1
    `,
    distinct(Prisma.sql`o.province`),
    distinct(Prisma.sql`o.city`),
  ]);
  const plain = (rows: { value: string }[]) =>
    rows.map((r) => ({ value: r.value, label: r.value }));
  return {
    origem: plain(origem),
    status: status.map((r) => ({ value: r.value, label: labelFor(financialStatusLabel, r.value) })),
    gateway: plain(gateway),
    metodo: metodo.map((r) => ({
      value: r.value,
      label: labelFor(processingMethodLabel, r.value),
    })),
    cupom: plain(cupom),
    uf: plain(uf),
    cidade: plain(cidade),
  };
}

const orderCost = Prisma.sql`left join lateral (
  select case when count(*) = count(i.unit_cost) then sum(i.quantity * i.unit_cost)::float8 end as cost
  from order_item i where i.order_id = o.id
) oc on true`;

const sortColumn: Record<OrdersSortField, Prisma.Sql> = {
  placedAt: Prisma.sql`o.placed_at`,
  number: Prisma.sql`o.number`,
  total: Prisma.sql`o.total_price`,
  items: Prisma.sql`o.items_count`,
  cost: Prisma.sql`oc.cost`,
  grossProfit: Prisma.sql`(o.total_price - oc.cost)`,
  margin: Prisma.sql`((o.total_price - oc.cost) / nullif(o.total_price, 0))`,
};

const MAX_EXPORT_ROWS = 5000;

export async function ordersList(
  clientId: string,
  search: PeriodSearch & OrdersSearch,
  options: { forExport?: boolean } = {},
): Promise<OrdersListPage> {
  const period = resolvePeriod(search);
  const platform = platformFor(search.canal);
  const filters = filtersOf(search);
  const where = ordersWhere(clientId, period.current, platform, filters);
  const query = filters.busca.trim();
  const searchFilter = query
    ? Prisma.sql`and (o.number ilike ${`%${query}%`} or c.name ilike ${`%${query}%`} or c.email ilike ${`%${query}%`})`
    : Prisma.empty;
  const direction = search.direcao === "asc" ? Prisma.sql`asc` : Prisma.sql`desc`;
  const pageSize = options.forExport ? MAX_EXPORT_ROWS : search.porPagina;
  const page = options.forExport ? 1 : search.pagina;

  const [rows, count] = await Promise.all([
    prismaClient.$queryRaw<
      {
        id: string;
        number: string;
        placed_at: Date;
        channel: string;
        source: string;
        status: string;
        customer_name: string;
        email: string;
        phone: string | null;
        total: number;
        items: number;
        cost: number | null;
      }[]
    >`
      select o.id, o.number, o.placed_at, o.channel, ${sourceExpression} as source,
        o.financial_status::text as status, c.name as customer_name, c.email, c.phone,
        o.total_price::float8 as total, o.items_count as items,
        oc.cost
      from sales_order o
      join customer c on c.id = o.customer_id
      ${orderCost}
      where ${where} ${searchFilter}
      order by ${sortColumn[search.ordenar]} ${direction} nulls last, o.placed_at desc
      limit ${pageSize} offset ${(page - 1) * pageSize}
    `,
    prismaClient.$queryRaw<{ total: number }[]>`
      select count(*)::int as total
      from sales_order o
      join customer c on c.id = o.customer_id
      where ${where} ${searchFilter}
    `,
  ]);

  const list: OrdersListRow[] = rows.map((r) => {
    const grossProfit = r.cost == null ? null : r.total - r.cost;
    return {
      id: r.id,
      number: r.number,
      placedAt: r.placed_at.toISOString(),
      channel: r.channel,
      source: r.source,
      status: r.status,
      statusLabel: labelFor(financialStatusLabel, r.status),
      customerName: r.customer_name,
      email: r.email,
      phone: r.phone,
      total: r.total,
      items: r.items,
      cost: r.cost,
      grossProfit,
      margin: grossProfit == null || r.total <= 0 ? null : (grossProfit / r.total) * 100,
    };
  });

  return {
    rows: list,
    total: count[0]?.total ?? 0,
    page,
    pageSize,
    sort: { field: search.ordenar, direction: search.direcao },
  };
}

export async function ordersScreen(
  clientId: string,
  search: PeriodSearch & OrdersSearch,
): Promise<OrdersScreen> {
  switch (search.aba) {
    case "resumo":
      return { aba: "resumo", summary: await ordersSummary(clientId, search) };
    case "aprovacao": {
      const [approval, options] = await Promise.all([
        ordersApproval(clientId, search),
        ordersFilterOptions(clientId, search),
      ]);
      return { aba: "aprovacao", approval, options };
    }
    case "lista": {
      const [list, options] = await Promise.all([
        ordersList(clientId, search),
        ordersFilterOptions(clientId, search),
      ]);
      return { aba: "lista", list, options };
    }
    case "regioes": {
      const period = resolvePeriod(search);
      const platform = platformFor(search.canal);
      const filters = filtersOf(search);
      const [provinces, cities, options] = await Promise.all([
        salesByProvince(clientId, period.current, platform, filters),
        salesByCity(clientId, period.current, platform, filters),
        ordersFilterOptions(clientId, search),
      ]);
      return { aba: "regioes", regions: { provinces, cities }, options };
    }
  }
}

export async function ordersExport(
  clientId: string,
  search: PeriodSearch & OrdersSearch,
): Promise<OrdersListRow[]> {
  return (await ordersList(clientId, search, { forExport: true })).rows;
}
