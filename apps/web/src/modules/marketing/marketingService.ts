/**
 * Marketing orchestrator: the only file of the module that touches Prisma.
 * Traffic and ad spend belong to the store's own site, so neither takes a
 * sales-platform filter - callers treat them as zero for marketplaces.
 * Server-only.
 */
import { prismaClient } from "@ecommerce/database/client";
import { isoDay, type Window } from "@ecommerce/contracts/shared/periodWindow";
import type {
  AdSpendAggregate,
  AdSpendBucket,
  TrafficAggregate,
  TrafficBucket,
} from "@ecommerce/contracts/marketing";

type TrafficRow = {
  sessions: number;
  users: number;
  new_users: number;
  view_item: number;
  add_to_cart: number;
  begin_checkout: number;
};

const toTraffic = (r: TrafficRow | undefined): TrafficAggregate => ({
  sessions: r?.sessions ?? 0,
  users: r?.users ?? 0,
  newUsers: r?.new_users ?? 0,
  viewItem: r?.view_item ?? 0,
  addToCart: r?.add_to_cart ?? 0,
  beginCheckout: r?.begin_checkout ?? 0,
});

type AdRow = {
  spend: number;
  platform_fee: number;
  impressions: number;
  clicks: number;
  attributed_revenue: number;
};

const toAdSpend = (r: AdRow | undefined): AdSpendAggregate => ({
  spend: r?.spend ?? 0,
  platformFee: r?.platform_fee ?? 0,
  impressions: r?.impressions ?? 0,
  clicks: r?.clicks ?? 0,
  attributedRevenue: r?.attributed_revenue ?? 0,
});

export async function trafficAggregate(clientId: string, w: Window): Promise<TrafficAggregate> {
  const rows = await prismaClient.$queryRaw<TrafficRow[]>`
    select coalesce(sum(sessions), 0)::int as sessions, coalesce(sum(users), 0)::int as users,
      coalesce(sum(new_users), 0)::int as new_users, coalesce(sum(view_item), 0)::int as view_item,
      coalesce(sum(add_to_cart), 0)::int as add_to_cart, coalesce(sum(begin_checkout), 0)::int as begin_checkout
    from traffic_daily
    where client_id = ${clientId} and date >= ${w.start} and date < ${w.end}
  `;
  return toTraffic(rows[0]);
}

export async function trafficByBucket(
  clientId: string,
  w: Window,
  unit: string,
): Promise<TrafficBucket[]> {
  const rows = await prismaClient.$queryRaw<(TrafficRow & { bucket: Date })[]>`
    select date_trunc(${unit}, date) as bucket,
      coalesce(sum(sessions), 0)::int as sessions, coalesce(sum(users), 0)::int as users,
      coalesce(sum(new_users), 0)::int as new_users, coalesce(sum(view_item), 0)::int as view_item,
      coalesce(sum(add_to_cart), 0)::int as add_to_cart, coalesce(sum(begin_checkout), 0)::int as begin_checkout
    from traffic_daily
    where client_id = ${clientId} and date >= ${w.start} and date < ${w.end}
    group by 1
    order by 1
  `;
  return rows.map((r) => ({ bucket: isoDay(r.bucket), ...toTraffic(r) }));
}

export async function adSpendAggregate(clientId: string, w: Window): Promise<AdSpendAggregate> {
  const rows = await prismaClient.$queryRaw<AdRow[]>`
    select coalesce(sum(spend), 0)::float8 as spend, coalesce(sum(platform_fee), 0)::float8 as platform_fee,
      coalesce(sum(impressions), 0)::int as impressions, coalesce(sum(clicks), 0)::int as clicks,
      coalesce(sum(attributed_revenue), 0)::float8 as attributed_revenue
    from ad_spend_daily
    where client_id = ${clientId} and date >= ${w.start} and date < ${w.end}
  `;
  return toAdSpend(rows[0]);
}

export async function adSpendByBucket(
  clientId: string,
  w: Window,
  unit: string,
): Promise<AdSpendBucket[]> {
  const rows = await prismaClient.$queryRaw<(AdRow & { bucket: Date })[]>`
    select date_trunc(${unit}, date) as bucket,
      coalesce(sum(spend), 0)::float8 as spend, coalesce(sum(platform_fee), 0)::float8 as platform_fee,
      coalesce(sum(impressions), 0)::int as impressions, coalesce(sum(clicks), 0)::int as clicks,
      coalesce(sum(attributed_revenue), 0)::float8 as attributed_revenue
    from ad_spend_daily
    where client_id = ${clientId} and date >= ${w.start} and date < ${w.end}
    group by 1
    order by 1
  `;
  return rows.map((r) => ({ bucket: isoDay(r.bucket), ...toAdSpend(r) }));
}
