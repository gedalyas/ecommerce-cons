import { Prisma, prismaClient } from "@ecommerce/database/client";
import { currentDay } from "@/shared/config/clock";
import {
  audienceValueLabelOf,
  siteKpis,
  type AudienceDimension,
  type MarketingSiteTab,
} from "@ecommerce/contracts/marketing";
import { metricValue } from "@ecommerce/contracts/shared/metricValue";
import type { PeriodSearch } from "@ecommerce/contracts/shared/period";
import {
  bucketWindows,
  isoDay,
  resolvePeriod,
  truncUnit,
  type Window,
} from "@ecommerce/contracts/shared/periodWindow";
import { lastMonthsWindow } from "./generalMetrics";
import {
  audienceRow,
  pageRow,
  regionRow,
  siteKpiUnit,
  siteKpiValues,
  siteSeries,
  type AudienceSums,
  type PageSums,
  type RegionSums,
  type SiteSums,
} from "./siteMetrics";

const PAGE_LIMIT = 50;

const trafficSums = Prisma.sql`
  coalesce(sum(t.sessions), 0)::int as "sessions",
  coalesce(sum(t.engaged_sessions), 0)::int as "engagedSessions",
  coalesce(sum(t.users), 0)::int as "users",
  coalesce(sum(t.new_users), 0)::int as "newUsers",
  coalesce(sum(t.page_views), 0)::int as "pageViews",
  coalesce(sum(t.duration_seconds), 0)::float8 as "durationSeconds"
`;

async function siteTotals(clientId: string, w: Window): Promise<SiteSums> {
  const [row] = await prismaClient.$queryRaw<SiteSums[]>`
    select ${trafficSums}
    from traffic_daily t
    where t.client_id = ${clientId} and t.date >= ${w.start} and t.date < ${w.end}
  `;
  return (
    row ?? {
      sessions: 0,
      engagedSessions: 0,
      users: 0,
      newUsers: 0,
      pageViews: 0,
      durationSeconds: 0,
    }
  );
}

async function siteByBucket(clientId: string, w: Window, granularity: "mes" | PeriodSearch["por"]) {
  const rows = await prismaClient.$queryRaw<(SiteSums & { bucket: Date })[]>`
    select date_trunc(${truncUnit[granularity]}, t.date::timestamp) as bucket, ${trafficSums}
    from traffic_daily t
    where t.client_id = ${clientId} and t.date >= ${w.start} and t.date < ${w.end}
    group by 1
    order by 1
  `;
  const buckets = bucketWindows(w, granularity).map((b) => b.bucket);
  return siteSeries(
    buckets,
    rows.map((r) => ({ ...r, bucket: isoDay(r.bucket) })),
  );
}

async function audience(clientId: string, w: Window, dimension: AudienceDimension) {
  const rows = await prismaClient.$queryRaw<Omit<AudienceSums, "label">[]>`
    select a.value, coalesce(sum(a.sessions), 0)::int as "sessions",
      coalesce(sum(a.engaged_sessions), 0)::int as "engagedSessions",
      coalesce(sum(a.users), 0)::int as "users", coalesce(sum(a.purchases), 0)::int as "purchases"
    from traffic_audience_daily a
    where a.client_id = ${clientId} and a.date >= ${w.start} and a.date < ${w.end}
      and a.dimension = ${dimension}::audience_dimension
    group by a.value
    order by a.value
  `;
  return rows.map((r) => audienceRow({ ...r, label: audienceValueLabelOf(dimension, r.value) }));
}

async function pages(clientId: string, w: Window) {
  const rows = await prismaClient.$queryRaw<PageSums[]>`
    select p.page_path as "path", coalesce(sum(p.page_views), 0)::int as "pageViews",
      coalesce(sum(p.sessions), 0)::int as "sessions",
      coalesce(sum(p.engaged_sessions), 0)::int as "engagedSessions",
      coalesce(sum(p.duration_seconds), 0)::float8 as "durationSeconds"
    from traffic_page_daily p
    where p.client_id = ${clientId} and p.date >= ${w.start} and p.date < ${w.end}
    group by p.page_path
    order by "pageViews" desc, p.page_path
    limit ${PAGE_LIMIT}
  `;
  return rows.map(pageRow);
}

async function regions(clientId: string, w: Window) {
  const rows = await prismaClient.$queryRaw<RegionSums[]>`
    select r.province, coalesce(sum(r.sessions), 0)::int as "sessions",
      coalesce(sum(r.page_views), 0)::int as "pageViews",
      coalesce(sum(r.engaged_sessions), 0)::int as "engagedSessions",
      coalesce(sum(r.purchases), 0)::int as "purchases"
    from traffic_region_daily r
    where r.client_id = ${clientId} and r.date >= ${w.start} and r.date < ${w.end}
    group by r.province
    order by "sessions" desc, r.province
  `;
  return rows.map(regionRow);
}

export async function siteTab(clientId: string, input: PeriodSearch): Promise<MarketingSiteTab> {
  const period = resolvePeriod(input);
  const w = period.current;
  const [cur, prev, monthly, daily, gender, age, pageRows, regionRows] = await Promise.all([
    siteTotals(clientId, w),
    period.previous ? siteTotals(clientId, period.previous) : null,
    siteByBucket(clientId, lastMonthsWindow(currentDay(), 12), "mes"),
    siteByBucket(clientId, w, input.por),
    audience(clientId, w, "GENDER"),
    audience(clientId, w, "AGE"),
    pages(clientId, w),
    regions(clientId, w),
  ]);
  const c = siteKpiValues(cur);
  const p = prev ? siteKpiValues(prev) : null;
  return {
    kpis: Object.fromEntries(
      siteKpis.map((k) => [k, metricValue(siteKpiUnit[k], c[k], p?.[k] ?? null)]),
    ) as MarketingSiteTab["kpis"],
    monthly,
    daily,
    gender,
    age,
    pages: pageRows,
    regions: regionRows,
  };
}
