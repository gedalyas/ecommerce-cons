/**
 * Order queries. Each exported function feeds one visual block and returns
 * the `{ current, previous }` envelope resolved server-side.
 */
import { db } from "@/server/db";
import { metricValue, type BreakdownSlice, type MetricValue, type Series } from "@/lib/metrics";
import type { PeriodSearch } from "@/lib/period";
import { fillSeries, isoDay, resolvePeriod, truncUnit, type Window } from "./period";

type Totals = { revenue: number; orders: number; captured: number; capturedOrders: number };

async function totals(clientId: string, w: Window): Promise<Totals> {
  const [row] = await db.$queryRaw<
    { revenue: number; orders: number; captured: number; captured_orders: number }[]
  >`
    select
      coalesce(sum(total_price) filter (where financial_status = 'PAID'), 0)::float8 as revenue,
      count(*) filter (where financial_status = 'PAID')::int as orders,
      coalesce(sum(total_price), 0)::float8 as captured,
      count(*)::int as captured_orders
    from sales_order
    where client_id = ${clientId} and placed_at >= ${w.start} and placed_at < ${w.end}
  `;
  return {
    revenue: row?.revenue ?? 0,
    orders: row?.orders ?? 0,
    captured: row?.captured ?? 0,
    capturedOrders: row?.captured_orders ?? 0,
  };
}

type BucketRow = { bucket: Date; revenue: number; orders: number };

async function byBucket(clientId: string, w: Window, unit: string): Promise<BucketRow[]> {
  return db.$queryRaw<BucketRow[]>`
    select
      date_trunc(${unit}, placed_at) as bucket,
      coalesce(sum(total_price) filter (where financial_status = 'PAID'), 0)::float8 as revenue,
      count(*) filter (where financial_status = 'PAID')::int as orders
    from sales_order
    where client_id = ${clientId} and placed_at >= ${w.start} and placed_at < ${w.end}
    group by 1
    order by 1
  `;
}

const statusLabel: Record<string, string> = {
  PAID: "Pago",
  PENDING: "Pendente",
  AUTHORIZED: "Autorizado",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

async function byStatus(clientId: string, w: Window): Promise<BreakdownSlice[]> {
  const rows = await db.$queryRaw<{ status: string; value: number }[]>`
    select financial_status::text as status, coalesce(sum(total_price), 0)::float8 as value
    from sales_order
    where client_id = ${clientId} and placed_at >= ${w.start} and placed_at < ${w.end}
    group by 1
    order by 2 desc
  `;
  const total = rows.reduce((s, r) => s + r.value, 0);
  return rows.map((r) => ({
    key: r.status.toLowerCase(),
    label: statusLabel[r.status] ?? r.status,
    value: r.value,
    share: total > 0 ? (r.value / total) * 100 : 0,
  }));
}

async function clientIdFor(slug: string) {
  const client = await db.client.findUnique({ where: { slug }, select: { id: true } });
  if (!client) throw new Error(`Unknown client "${slug}"`);
  return client.id;
}

export type OrdersOverview = {
  metrics: {
    totalSold: MetricValue;
    orders: MetricValue;
    averageTicket: MetricValue;
    approvalRate: MetricValue;
  };
  series: {
    totalSold: Series;
    orders: Series;
    averageTicket: Series;
  };
  byStatus: BreakdownSlice[];
};

export async function ordersOverview(
  clientSlug: string,
  search: PeriodSearch,
): Promise<OrdersOverview> {
  const clientId = await clientIdFor(clientSlug);
  const period = resolvePeriod(search);
  const unit = truncUnit[period.por];

  const [cur, prev, curBuckets, prevBuckets, status] = await Promise.all([
    totals(clientId, period.current),
    period.previous ? totals(clientId, period.previous) : null,
    byBucket(clientId, period.current, unit),
    period.previous ? byBucket(clientId, period.previous, unit) : null,
    byStatus(clientId, period.current),
  ]);

  const ticket = (t: Totals) => (t.orders > 0 ? t.revenue / t.orders : null);
  const approval = (t: Totals) => (t.captured > 0 ? (t.revenue / t.captured) * 100 : null);

  const series = (rows: BucketRow[] | null, w: Window | null, pick: (r: BucketRow) => number) =>
    rows && w
      ? fillSeries(
          w,
          period.por,
          rows.map((r) => ({ bucket: isoDay(r.bucket), value: pick(r) })),
        )
      : null;

  const envelope = (pick: (r: BucketRow) => number): Series => ({
    current: series(curBuckets, period.current, pick) ?? [],
    previous: series(prevBuckets, period.previous, pick),
  });

  return {
    metrics: {
      totalSold: metricValue("currency", cur.revenue, prev?.revenue ?? null),
      orders: metricValue("count", cur.orders, prev?.orders ?? null),
      averageTicket: metricValue("currency", ticket(cur), prev ? ticket(prev) : null),
      approvalRate: metricValue("percent", approval(cur), prev ? approval(prev) : null),
    },
    series: {
      totalSold: envelope((r) => r.revenue),
      orders: envelope((r) => r.orders),
      averageTicket: envelope((r) => (r.orders > 0 ? r.revenue / r.orders : 0)),
    },
    byStatus: status,
  };
}
