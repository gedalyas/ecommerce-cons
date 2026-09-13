import type { InfluencerStatus } from "@/generated/prisma/enums";
import { prismaClient } from "@/shared/dependencies/prismaClient";
import type { PeriodSearch } from "@/shared/utils/period";
import { resolvePeriod, type Window } from "@/shared/utils/periodWindow";
import {
  emptyActivity,
  influencerCost,
  repurchaseRateOf,
  roiOf,
  sumActivity,
} from "./influencerCost";
import type {
  Influencer,
  InfluencerActivity,
  InfluencerCoupon,
  InfluencerRow,
  InfluencersScreen,
} from "./influencers.types";
import type { InfluencerParsed, InfluencersSearch } from "./influencersSchema";

async function clientIdFor(slug: string) {
  const client = await prismaClient.client.findUnique({ where: { slug }, select: { id: true } });
  if (!client) throw new Error(`Unknown client "${slug}"`);
  return client.id;
}

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

export async function createInfluencer(clientSlug: string, input: InfluencerParsed) {
  const clientId = await clientIdFor(clientSlug);
  const row = await prismaClient.influencer.create({
    data: { clientId, ...dataOf(input) },
    include,
  });
  return toInfluencer(row);
}

export async function updateInfluencer(clientSlug: string, id: string, input: InfluencerParsed) {
  const clientId = await clientIdFor(clientSlug);
  const row = await prismaClient.$transaction(async (tx) => {
    await tx.influencerRule.deleteMany({ where: { influencerId: id } });
    await tx.influencerCoupon.deleteMany({ where: { influencerId: id } });
    return tx.influencer.update({ where: { id, clientId }, data: dataOf(input), include });
  });
  return toInfluencer(row);
}

export async function deleteInfluencer(clientSlug: string, id: string) {
  const clientId = await clientIdFor(clientSlug);
  await prismaClient.influencer.delete({ where: { id, clientId } });
}

type ActivityRow = {
  code: string;
  orders: number;
  revenue: number;
  product_revenue: number;
  shipping_revenue: number;
  customers: number;
  new_customers: number;
  repeat_orders: number;
};

async function activityByCoupon(clientId: string, w: Window): Promise<Map<string, ActivityRow>> {
  const rows = await prismaClient.$queryRaw<ActivityRow[]>`
    select code, count(*)::int as orders,
      coalesce(sum(o.total_price), 0)::float8 as revenue,
      coalesce(sum(o.product_revenue), 0)::float8 as product_revenue,
      coalesce(sum(o.shipping_revenue), 0)::float8 as shipping_revenue,
      count(distinct o.customer_id)::int as customers,
      count(*) filter (where o.order_number_for_customer = 1)::int as new_customers,
      count(*) filter (where o.order_number_for_customer >= 2)::int as repeat_orders
    from sales_order o, unnest(o.discount_codes) as code
    where o.client_id = ${clientId} and o.financial_status = 'PAID'
      and o.placed_at >= ${w.start} and o.placed_at < ${w.end}
    group by 1
  `;
  return new Map(rows.map((r) => [r.code, r]));
}

const couponActive = (coupon: InfluencerCoupon, calendar: { inicio: string; fim: string }) =>
  (coupon.activeFrom == null || coupon.activeFrom <= calendar.fim) &&
  (coupon.activeUntil == null || coupon.activeUntil >= calendar.inicio);

const activityOf = (
  influencer: Influencer,
  byCoupon: Map<string, ActivityRow>,
  calendar: { inicio: string; fim: string },
): InfluencerActivity =>
  sumActivity(
    influencer.coupons
      .filter((c) => couponActive(c, calendar))
      .map((c) => byCoupon.get(c.code))
      .map((r) =>
        r
          ? {
              orders: r.orders,
              revenue: r.revenue,
              productRevenue: r.product_revenue,
              shippingRevenue: r.shipping_revenue,
              customers: r.customers,
              newCustomers: r.new_customers,
              repeatOrders: r.repeat_orders,
            }
          : emptyActivity,
      ),
  );

export async function influencersScreen(
  clientSlug: string,
  search: PeriodSearch & InfluencersSearch,
): Promise<InfluencersScreen> {
  const clientId = await clientIdFor(clientSlug);
  const period = resolvePeriod(search);
  const calendar = { inicio: search.inicio, fim: search.fim };
  const [stored, byCoupon] = await Promise.all([
    prismaClient.influencer.findMany({ where: { clientId }, include, orderBy: { name: "asc" } }),
    activityByCoupon(clientId, period.current),
  ]);
  const all = stored.map(toInfluencer);
  const query = search.busca.trim().toLowerCase();
  const rows: InfluencerRow[] = all
    .filter((i) => i.status === search.status)
    .filter((i) => !query || `${i.name} ${i.handle}`.toLowerCase().includes(query))
    .map((i) => {
      const activity = activityOf(i, byCoupon, calendar);
      const cost = influencerCost(i.rules, calendar, activity);
      return {
        ...i,
        ...activity,
        cost,
        roi: roiOf(activity.revenue, cost),
        repurchaseRate: repurchaseRateOf(activity),
      };
    });
  const activity = sumActivity(rows);
  const cost = rows.reduce((s, r) => s + r.cost, 0);
  const counts = { ACTIVE: 0, PAUSED: 0, ARCHIVED: 0 };
  for (const i of all) counts[i.status] += 1;
  return {
    rows,
    totals: {
      ...activity,
      cost,
      roi: roiOf(activity.revenue, cost),
      repurchaseRate: repurchaseRateOf(activity),
    },
    counts,
  };
}
