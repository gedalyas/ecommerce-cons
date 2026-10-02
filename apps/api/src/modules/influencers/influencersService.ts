import type { InfluencerStatus } from "@ecommerce/database/enums";
import { Prisma, prismaClient } from "@ecommerce/database/client";
import type { PeriodSearch } from "@ecommerce/contracts/shared/period";
import { resolvePeriod, type Window } from "@ecommerce/contracts/shared/periodWindow";
import { ownerOf } from "@/modules/connections/contract";
import { emptyActivity, influencerCost, repurchaseRateOf, roiOf } from "./influencerCost";
import {
  couponSourceNotice,
  type Influencer,
  type InfluencerActivity,
  type InfluencerRow,
  type InfluencersScreen,
  type InfluencerParsed,
  type InfluencersSearch,
} from "@ecommerce/contracts/influencers";

const isoDay = (d: Date) => d.toISOString().slice(0, 10);
const dateOf = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

type StoredInfluencer = {
  id: string;
  name: string;
  handle: string | null;
  status: InfluencerStatus;
  notes: string | null;
  rules: {
    id: string;
    type: Influencer["rules"][number]["type"];
    value: { toString(): string };
    startDate: Date;
    endDate: Date | null;
    cap: { toString(): string } | null;
    notes: string | null;
  }[];
  coupons: { id: string; code: string; activeFrom: Date | null; activeUntil: Date | null }[];
};

const toInfluencer = (r: StoredInfluencer): Influencer => ({
  id: r.id,
  name: r.name,
  handle: r.handle ?? "",
  status: r.status,
  notes: r.notes ?? "",
  rules: r.rules.map((rule) => ({
    id: rule.id,
    type: rule.type,
    value: Number(rule.value),
    startDate: isoDay(rule.startDate),
    endDate: rule.endDate ? isoDay(rule.endDate) : null,
    cap: rule.cap == null ? null : Number(rule.cap),
    notes: rule.notes ?? "",
  })),
  coupons: r.coupons.map((c) => ({
    id: c.id,
    code: c.code,
    activeFrom: c.activeFrom ? isoDay(c.activeFrom) : null,
    activeUntil: c.activeUntil ? isoDay(c.activeUntil) : null,
  })),
});

const include = {
  rules: { orderBy: { position: "asc" as const } },
  coupons: { orderBy: { code: "asc" as const } },
};

const dataOf = (input: InfluencerParsed) => ({
  name: input.name,
  handle: input.handle || null,
  status: input.status,
  notes: input.notes || null,
  rules: {
    create: input.rules.map((r, position) => ({
      type: r.type,
      value: r.value,
      startDate: dateOf(r.startDate),
      endDate: r.endDate ? dateOf(r.endDate) : null,
      cap: r.cap,
      notes: r.notes || null,
      position,
    })),
  },
  coupons: {
    create: input.coupons.map((c) => ({
      code: c.code,
      activeFrom: c.activeFrom ? dateOf(c.activeFrom) : null,
      activeUntil: c.activeUntil ? dateOf(c.activeUntil) : null,
    })),
  },
});

export async function createInfluencer(clientId: string, input: InfluencerParsed) {
  const row = await prismaClient.influencer.create({
    data: { clientId, ...dataOf(input) },
    include,
  });
  return toInfluencer(row);
}

export async function updateInfluencer(clientId: string, id: string, input: InfluencerParsed) {
  const row = await prismaClient.$transaction(async (tx) => {
    await tx.influencerRule.deleteMany({ where: { influencerId: id } });
    await tx.influencerCoupon.deleteMany({ where: { influencerId: id } });
    return tx.influencer.update({ where: { id, clientId }, data: dataOf(input), include });
  });
  return toInfluencer(row);
}

export async function deleteInfluencer(clientId: string, id: string) {
  await prismaClient.influencer.delete({ where: { id, clientId } });
}

type ActivityRow = {
  influencer_id: string | null;
  orders: number;
  revenue: number;
  product_revenue: number;
  shipping_revenue: number;
  customers: number;
  new_customers: number;
  repeat_orders: number;
};

const activityOfRow = (r: ActivityRow): InfluencerActivity => ({
  orders: r.orders,
  revenue: r.revenue,
  productRevenue: r.product_revenue,
  shippingRevenue: r.shipping_revenue,
  customers: r.customers,
  newCustomers: r.new_customers,
  repeatOrders: r.repeat_orders,
});

const couponValues = (influencers: readonly Influencer[]) =>
  influencers.flatMap((i) =>
    i.coupons.map(
      (c) => Prisma.sql`(${i.id}, ${c.code}, ${c.activeFrom}::date, ${c.activeUntil}::date)`,
    ),
  );

type CouponActivity = { byInfluencer: Map<string, InfluencerActivity>; total: InfluencerActivity };

async function couponActivity(
  clientId: string,
  w: Window,
  influencers: readonly Influencer[],
): Promise<CouponActivity> {
  const values = couponValues(influencers);
  if (values.length === 0) return { byInfluencer: new Map(), total: emptyActivity };
  const rows = await prismaClient.$queryRaw<ActivityRow[]>`
    with coupon(influencer_id, code, active_from, active_until) as (
      values ${Prisma.join(values)}
    ),
    matched as (
      select distinct c.influencer_id, o.id, o.total_price, o.product_revenue,
        o.shipping_revenue, o.customer_id, o.order_number_for_customer
      from sales_order o
      join coupon c on c.code = any(o.discount_codes)
        and (c.active_from is null or o.placed_at >= c.active_from)
        and (c.active_until is null or o.placed_at < c.active_until + interval '1 day')
      where o.client_id = ${clientId} and o.financial_status = 'PAID'
        and o.placed_at >= ${w.start} and o.placed_at < ${w.end}
    ),
    per_order as (
      select distinct on (id) null::text as influencer_id, id, total_price, product_revenue,
        shipping_revenue, customer_id, order_number_for_customer
      from matched
    )
    select influencer_id, count(*)::int as orders,
      coalesce(sum(total_price), 0)::float8 as revenue,
      coalesce(sum(product_revenue), 0)::float8 as product_revenue,
      coalesce(sum(shipping_revenue), 0)::float8 as shipping_revenue,
      count(distinct customer_id)::int as customers,
      count(*) filter (where order_number_for_customer = 1)::int as new_customers,
      count(*) filter (where order_number_for_customer >= 2)::int as repeat_orders
    from (select * from matched union all select * from per_order) t
    group by influencer_id
  `;
  const total = rows.find((r) => r.influencer_id === null);
  return {
    byInfluencer: new Map(
      rows.flatMap((r) => (r.influencer_id ? [[r.influencer_id, activityOfRow(r)] as const] : [])),
    ),
    total: total ? activityOfRow(total) : emptyActivity,
  };
}

export async function influencersScreen(
  clientId: string,
  search: PeriodSearch & InfluencersSearch,
): Promise<InfluencersScreen> {
  const period = resolvePeriod(search);
  const calendar = { inicio: search.inicio, fim: search.fim };
  const stored = await prismaClient.influencer.findMany({
    where: { clientId },
    include,
    orderBy: { name: "asc" },
  });
  const all = stored.map(toInfluencer);
  const query = search.busca.trim().toLowerCase();
  const visible = all
    .filter((i) => i.status === search.status)
    .filter((i) => !query || `${i.name} ${i.handle}`.toLowerCase().includes(query));
  const [{ byInfluencer, total }, salesSource] = await Promise.all([
    couponActivity(clientId, period.current, visible),
    ownerOf(clientId, "sales"),
  ]);
  const rows: InfluencerRow[] = visible.map((i) => {
    const activity = byInfluencer.get(i.id) ?? emptyActivity;
    const cost = influencerCost(i.rules, calendar, activity);
    return {
      ...i,
      ...activity,
      cost,
      roi: roiOf(activity.revenue, cost),
      repurchaseRate: repurchaseRateOf(activity),
    };
  });
  const cost = rows.reduce((s, r) => s + r.cost, 0);
  const counts = { ACTIVE: 0, PAUSED: 0, ARCHIVED: 0 };
  for (const i of all) counts[i.status] += 1;
  return {
    rows,
    totals: {
      ...total,
      cost,
      roi: roiOf(total.revenue, cost),
      repurchaseRate: repurchaseRateOf(total),
    },
    counts,
    couponNotice: couponSourceNotice(salesSource),
  };
}
