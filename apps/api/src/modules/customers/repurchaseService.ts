import { Prisma, prismaClient } from "@ecommerce/database/client";
import type { SalesPlatform } from "@ecommerce/database/enums";
import { adSpendAggregate, adSpendByBucket } from "@/modules/marketing/contract";
import { costRulesFor, expandCosts } from "@/modules/money/contract";
import { type CostRule } from "@ecommerce/contracts/money";
import { ordersAggregate, ordersByBucket } from "@/modules/orders/contract";
import type { BreakdownSlice } from "@ecommerce/contracts/shared/metric.types";
import { metricValue } from "@ecommerce/contracts/shared/metricValue";
import type { Channel, PeriodSearch } from "@ecommerce/contracts/shared/period";
import {
  bucketWindows,
  fillSeries,
  resolvePeriod,
  truncUnit,
  type Window,
} from "@ecommerce/contracts/shared/periodWindow";
import type {
  CustomersLtvCac,
  CustomersRepurchase,
  OrderNumberRow,
  RepurchaseMetric,
} from "@ecommerce/contracts/customers";
import { customersAggregate, customersByBucket } from "./customersService";
import {
  computeLtvCac,
  computeRepurchase,
  retentionByOrderNumber,
  type RepurchaseFacts,
} from "./repurchaseMetrics";

const platformFor = (channel: Channel): SalesPlatform | null =>
  channel === "ecommerce" ? "ECOMMERCE" : channel === "marketplace" ? "MARKETPLACE" : null;

const platformFilter = (platform: SalesPlatform | null) =>
  platform ? Prisma.sql`and o.sales_platform = ${platform}::sales_platform` : Prisma.empty;

const rankedOrders = (clientId: string) => Prisma.sql`
  select o.id, o.customer_id, o.placed_at, o.total_price, o.sales_platform,
    row_number() over (partition by o.customer_id order by o.placed_at) as n,
    min(o.placed_at) over (partition by o.customer_id) as first_at
  from sales_order o
  where o.client_id = ${clientId} and o.financial_status = 'PAID'
`;

async function repurchaseFacts(
  clientId: string,
  w: Window,
  platform: SalesPlatform | null,
): Promise<Omit<RepurchaseFacts, "lifetimeFrequency">> {
  const [row] = await prismaClient.$queryRaw<
    {
      revenue: number;
      repeat_revenue: number;
      orders: number;
      repeat_orders: number;
      customers: number;
      repeat_customers: number;
    }[]
  >`
    with ranked as (${rankedOrders(clientId)})
    select coalesce(sum(total_price), 0)::float8 as revenue,
      coalesce(sum(total_price) filter (where n >= 2), 0)::float8 as repeat_revenue,
      count(*)::int as orders,
      count(*) filter (where n >= 2)::int as repeat_orders,
      count(distinct customer_id)::int as customers,
      count(distinct customer_id) filter (where n >= 2)::int as repeat_customers
    from ranked o
    where o.placed_at >= ${w.start} and o.placed_at < ${w.end} ${platformFilter(platform)}
  `;
  return {
    revenue: row?.revenue ?? 0,
    repeatRevenue: row?.repeat_revenue ?? 0,
    orders: row?.orders ?? 0,
    repeatOrders: row?.repeat_orders ?? 0,
    customers: row?.customers ?? 0,
    repeatCustomers: row?.repeat_customers ?? 0,
  };
}

async function lifetimeFrequency(clientId: string): Promise<number | null> {
  const [row] = await prismaClient.$queryRaw<{ frequency: number | null }[]>`
    select avg(orders_count)::float8 as frequency from customer where client_id = ${clientId} and orders_count > 0
  `;
  return row?.frequency ?? null;
}

const orderNumberLabel = (n: number) => (n >= 7 ? "7º ou mais" : `${n}º`);

async function byOrderNumber(
  clientId: string,
  w: Window,
  platform: SalesPlatform | null,
): Promise<OrderNumberRow[]> {
  const rows = await prismaClient.$queryRaw<
    { n: number; revenue: number; orders: number; days_from_first: number | null }[]
  >`
    with ranked as (${rankedOrders(clientId)})
    select least(n, 7)::int as n, coalesce(sum(total_price), 0)::float8 as revenue, count(*)::int as orders,
      avg(extract(epoch from (placed_at - first_at)) / 86400) filter (where n >= 2)::float8 as days_from_first
    from ranked o
    where o.placed_at >= ${w.start} and o.placed_at < ${w.end} ${platformFilter(platform)}
    group by 1
    order by 1
  `;
  return [1, 2, 3, 4, 5, 6, 7].map((n) => {
    const r = rows.find((x) => x.n === n);
    return {
      orderNumber: n,
      label: orderNumberLabel(n),
      revenue: r?.revenue ?? 0,
      orders: r?.orders ?? 0,
      averageTicket: r && r.orders > 0 ? r.revenue / r.orders : null,
      daysFromFirst: n === 1 ? null : (r?.days_from_first ?? null),
    };
  });
}

export async function customersRepurchase(
  clientId: string,
  search: PeriodSearch,
): Promise<CustomersRepurchase> {
  const period = resolvePeriod(search);
  const unit = truncUnit[period.por];
  const platform = platformFor(search.canal);
  const [current, previous, frequency, byNumber, buckets, prevBuckets] = await Promise.all([
    repurchaseFacts(clientId, period.current, platform),
    period.previous ? repurchaseFacts(clientId, period.previous, platform) : null,
    lifetimeFrequency(clientId),
    byOrderNumber(clientId, period.current, platform),
    ordersByBucket(clientId, period.current, unit, platform),
    period.previous ? ordersByBucket(clientId, period.previous, unit, platform) : null,
  ]);
  const cur = computeRepurchase({ ...current, lifetimeFrequency: frequency });
  const prev = previous ? computeRepurchase({ ...previous, lifetimeFrequency: frequency }) : null;
  const m = (
    key: keyof typeof cur,
    question: string,
    unitOf: RepurchaseMetric["unit"],
    goodWhen: RepurchaseMetric["goodWhen"] = "up",
  ): RepurchaseMetric => ({
    key,
    question,
    unit: unitOf,
    goodWhen,
    metric: metricValue(unitOf, cur[key], prev?.[key] ?? null),
  });
  const firstVsRepeat: BreakdownSlice[] = [
    {
      key: "first",
      label: "Primeira compra",
      value: cur.revenue - cur.repeatRevenue,
      share: cur.revenue > 0 ? ((cur.revenue - cur.repeatRevenue) / cur.revenue) * 100 : 0,
    },
    {
      key: "repeat",
      label: "Recompra",
      value: cur.repeatRevenue,
      share: cur.revenue > 0 ? (cur.repeatRevenue / cur.revenue) * 100 : 0,
    },
  ];
  return {
    revenue: [
      m("revenue", "Quanto é o total vendido?", "currency"),
      m("repeatRevenue", "Quanto é o total vendido em pedidos de recompra?", "currency"),
      m("repeatRevenueRate", "Qual é a taxa de recompra em relação ao total vendido?", "percent"),
    ],
    orders: [
      m("orders", "Quantos pedidos eu fiz neste período?", "count"),
      m("repeatOrders", "Quantos pedidos de recompra eu fiz neste período?", "count"),
      m("repeatOrderRate", "Qual é a taxa de pedidos de recompra em relação ao total?", "percent"),
    ],
    customers: [
      m("customers", "Quantos clientes compraram?", "count"),
      m("repeatCustomers", "Quantos clientes compraram mais de uma vez?", "count"),
      m("repeatCustomerRate", "Qual é a taxa de clientes com recompra?", "percent"),
      m("frequency", "Quantas vezes um cliente compra na minha loja ao longo da vida?", "count"),
    ],
    revenueSeries: {
      current: fillSeries(
        period.current,
        period.por,
        buckets.map((b) => ({ bucket: b.bucket, value: b.revenue })),
      ),
      previous:
        prevBuckets && period.previous
          ? fillSeries(
              period.previous,
              period.por,
              prevBuckets.map((b) => ({ bucket: b.bucket, value: b.revenue })),
            )
          : null,
    },
    firstVsRepeat,
    byOrderNumber: byNumber,
  };
}

const investmentOf = (
  adSpend: number,
  platformFee: number,
  rules: readonly CostRule[],
  calendar: { inicio: string; fim: string },
  orders: {
    ecommerce: { orders: number; revenue: number };
    marketplace: { orders: number; revenue: number };
  },
) =>
  adSpend +
  platformFee +
  expandCosts(rules, calendar, {
    ecommerce: orders.ecommerce,
    marketplace: orders.marketplace,
    adSpend,
  }).salesMarketing;

export async function customersLtvCac(
  clientId: string,
  search: PeriodSearch,
): Promise<CustomersLtvCac> {
  const period = resolvePeriod(search);
  const unit = truncUnit[period.por];
  const platform = platformFor(search.canal);
  const mediaApplies = search.canal !== "marketplace";
  const buckets = bucketWindows(period.current, period.por);
  const prevBuckets = period.previous ? bucketWindows(period.previous, period.por) : null;
  const previousCalendar = prevBuckets
    ? { inicio: prevBuckets[0]!.inicio, fim: prevBuckets[prevBuckets.length - 1]!.fim }
    : null;

  const [
    rules,
    frequency,
    orders,
    prevOrders,
    customers,
    prevCustomers,
    ads,
    prevAds,
    ordersB,
    customersB,
    adsB,
    byOrders,
  ] = await Promise.all([
    costRulesFor(clientId),
    lifetimeFrequency(clientId),
    ordersAggregate(clientId, period.current, platform),
    period.previous ? ordersAggregate(clientId, period.previous, platform) : null,
    customersAggregate(clientId, period.current, platform),
    period.previous ? customersAggregate(clientId, period.previous, platform) : null,
    mediaApplies ? adSpendAggregate(clientId, period.current) : null,
    mediaApplies && period.previous ? adSpendAggregate(clientId, period.previous) : null,
    ordersByBucket(clientId, period.current, unit, platform),
    customersByBucket(clientId, period.current, unit, platform),
    mediaApplies ? adSpendByBucket(clientId, period.current, unit) : [],
    prismaClient.$queryRaw<{ orders: number; customers: number }[]>`
        select orders_count as orders, count(*)::int as customers from customer
        where client_id = ${clientId} and orders_count > 0 group by 1
      `,
  ]);

  const calendar = { inicio: search.inicio, fim: search.fim };
  const cur = computeLtvCac({
    revenue: orders.revenue,
    orders: orders.orders,
    newCustomers: customers.newCustomers,
    marketingInvestment: investmentOf(
      ads?.spend ?? 0,
      ads?.platformFee ?? 0,
      rules,
      calendar,
      orders,
    ),
    lifetimeFrequency: frequency,
  });
  const prev =
    prevOrders && prevCustomers && previousCalendar
      ? computeLtvCac({
          revenue: prevOrders.revenue,
          orders: prevOrders.orders,
          newCustomers: prevCustomers.newCustomers,
          marketingInvestment: investmentOf(
            prevAds?.spend ?? 0,
            prevAds?.platformFee ?? 0,
            rules,
            previousCalendar,
            prevOrders,
          ),
          lifetimeFrequency: frequency,
        })
      : null;

  const ordersMap = new Map(ordersB.map((b) => [b.bucket, b]));
  const customersMap = new Map(customersB.map((b) => [b.bucket, b]));
  const adsMap = new Map(adsB.map((b) => [b.bucket, b]));
  const perBucket = buckets.map((b) => {
    const o = ordersMap.get(b.bucket);
    const c = customersMap.get(b.bucket);
    const a = adsMap.get(b.bucket);
    const empty = { ecommerce: { orders: 0, revenue: 0 }, marketplace: { orders: 0, revenue: 0 } };
    const values = computeLtvCac({
      revenue: o?.revenue ?? 0,
      orders: o?.orders ?? 0,
      newCustomers: c?.newCustomers ?? 0,
      marketingInvestment: investmentOf(a?.spend ?? 0, a?.platformFee ?? 0, rules, b, o ?? empty),
      lifetimeFrequency: frequency,
    });
    return { bucket: b.bucket, values, newCustomers: c?.newCustomers ?? 0 };
  });

  return {
    metrics: [
      {
        key: "ltv",
        label: "Lifetime value",
        unit: "currency",
        goodWhen: "up",
        metric: metricValue("currency", cur.ltv, prev?.ltv ?? null),
      },
      {
        key: "cac",
        label: "CAC por cliente",
        unit: "currency",
        goodWhen: "down",
        metric: metricValue("currency", cur.cac, prev?.cac ?? null),
      },
      {
        key: "ltvCacRatio",
        label: "LTV/CAC",
        unit: "multiplier",
        goodWhen: "up",
        metric: metricValue("multiplier", cur.ltvCacRatio, prev?.ltvCacRatio ?? null),
        reference: "saudável ≥ 3",
      },
      {
        key: "frequency",
        label: "Frequência de compra",
        unit: "count",
        goodWhen: "up",
        metric: metricValue("count", frequency, frequency),
      },
      {
        key: "newCustomers",
        label: "Novos clientes",
        unit: "count",
        goodWhen: "up",
        metric: metricValue("count", customers.newCustomers, prevCustomers?.newCustomers ?? null),
      },
    ],
    ltvSeries: perBucket.map((b) => ({ bucket: b.bucket, value: b.values.ltv ?? 0 })),
    cacSeries: perBucket.map((b) => ({ bucket: b.bucket, value: b.values.cac ?? 0 })),
    cpaSeries: perBucket.map((b) => ({ bucket: b.bucket, value: b.values.cpa ?? 0 })),
    newCustomersSeries: perBucket.map((b) => ({ bucket: b.bucket, value: b.newCustomers })),
    retention: retentionByOrderNumber(byOrders).map((r) => ({
      ...r,
      label: orderNumberLabel(r.orderNumber),
    })),
  };
}
