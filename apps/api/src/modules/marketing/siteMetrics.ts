import type {
  SiteAudienceRow,
  SiteKpi,
  SitePageRow,
  SiteRegionRow,
  SiteSeriesPoint,
} from "@ecommerce/contracts/marketing";
import type { MetricUnit } from "@ecommerce/contracts/shared/metric.types";

export type SiteSums = {
  sessions: number;
  engagedSessions: number;
  users: number;
  newUsers: number;
  pageViews: number;
  durationSeconds: number;
};

export type SiteBucketSums = SiteSums & { bucket: string };

export type AudienceSums = {
  value: string;
  label: string;
  sessions: number;
  engagedSessions: number;
  users: number;
  purchases: number;
};

export type PageSums = {
  path: string;
  pageViews: number;
  sessions: number;
  engagedSessions: number;
  durationSeconds: number;
};

export type RegionSums = {
  province: string;
  sessions: number;
  pageViews: number;
  engagedSessions: number;
  purchases: number;
};

const share = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : null);

export const siteKpiUnit: Record<SiteKpi, MetricUnit> = {
  sessions: "count",
  engagedSessions: "count",
  users: "count",
  newUsers: "count",
  pageViews: "count",
  averageDuration: "seconds",
  engagementRate: "percent",
  bounceRate: "percent",
};

export function siteKpiValues(s: SiteSums): Record<SiteKpi, number | null> {
  const engagementRate = share(s.engagedSessions, s.sessions);
  return {
    sessions: s.sessions,
    engagedSessions: s.engagedSessions,
    users: s.users,
    newUsers: s.newUsers,
    pageViews: s.pageViews,
    averageDuration: s.sessions > 0 ? s.durationSeconds / s.sessions : null,
    engagementRate,
    bounceRate: engagementRate == null ? null : 100 - engagementRate,
  };
}

export function siteSeries(
  buckets: readonly string[],
  rows: readonly SiteBucketSums[],
): SiteSeriesPoint[] {
  const byBucket = new Map(rows.map((r) => [r.bucket, r]));
  return buckets.map((bucket) => {
    const r = byBucket.get(bucket);
    const sessions = r?.sessions ?? 0;
    const users = r?.users ?? 0;
    return {
      bucket,
      sessions,
      engagedSessions: r?.engagedSessions ?? 0,
      engagementRate: share(r?.engagedSessions ?? 0, sessions),
      users,
      newUsers: r?.newUsers ?? 0,
      newUserShare: share(r?.newUsers ?? 0, users),
    };
  });
}

export const audienceRow = (r: AudienceSums): SiteAudienceRow => ({
  ...r,
  engagementRate: share(r.engagedSessions, r.sessions),
  purchaseRate: share(r.purchases, r.sessions),
});

export const pageRow = (r: PageSums): SitePageRow => ({
  path: r.path,
  pageViews: r.pageViews,
  sessions: r.sessions,
  engagementRate: share(r.engagedSessions, r.sessions),
  averageDuration: r.sessions > 0 ? r.durationSeconds / r.sessions : null,
});

export const regionRow = (r: RegionSums): SiteRegionRow => ({
  province: r.province,
  sessions: r.sessions,
  pageViews: r.pageViews,
  engagementRate: share(r.engagedSessions, r.sessions),
  purchases: r.purchases,
  purchaseRate: share(r.purchases, r.sessions),
});
