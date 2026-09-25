import type {
  AdSpendBucket,
  FunnelCounts,
  FunnelStepDelta,
  SalesInvestmentPoint,
  TrafficBucket,
  TrafficPoint,
} from "@ecommerce/contracts/marketing";
import { funnelStepLabel, funnelSteps } from "@ecommerce/contracts/marketing";
import type { OrdersBucket } from "@ecommerce/contracts/orders";
import type { Window } from "@ecommerce/contracts/shared/periodWindow";

type Spend = { spend: number; platformFee: number };

export const investedOf = (ads: Spend | null | undefined, includeFee: boolean): number =>
  ads ? ads.spend + (includeFee ? ads.platformFee : 0) : 0;

const byBucket = <T extends { bucket: string }>(rows: readonly T[]) =>
  new Map(rows.map((r) => [r.bucket, r]));

export function salesInvestmentPoints(
  buckets: readonly string[],
  orders: readonly OrdersBucket[],
  ads: readonly AdSpendBucket[],
  siteInvested: readonly { bucket: string; investment: number }[],
  includeFee: boolean,
): SalesInvestmentPoint[] {
  const o = byBucket(orders);
  const a = byBucket(ads);
  const site = byBucket(siteInvested);
  return buckets.map((bucket) => {
    const sold = o.get(bucket)?.revenue ?? 0;
    const siteSold = o.get(bucket)?.ecommerce.revenue ?? 0;
    const invested = investedOf(a.get(bucket), includeFee);
    const toSite = site.get(bucket)?.investment ?? 0;
    return { bucket, sold, invested, roas: toSite > 0 ? siteSold / toSite : null };
  });
}

export function trafficPoints(
  buckets: readonly string[],
  traffic: readonly TrafficBucket[],
  orders: readonly OrdersBucket[],
): TrafficPoint[] {
  const t = byBucket(traffic);
  const o = byBucket(orders);
  return buckets.map((bucket) => {
    const sessions = t.get(bucket)?.sessions ?? 0;
    const storeOrders = o.get(bucket)?.ecommerce.orders ?? 0;
    return {
      bucket,
      sessions,
      newUsers: t.get(bucket)?.newUsers ?? 0,
      conversionRate: sessions > 0 ? (storeOrders / sessions) * 100 : null,
    };
  });
}

export function monthEndProjection(toDate: number, today: string): number | null {
  const [year, month, day] = today.split("-").map(Number);
  if (!year || !month || !day) return null;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return (toDate / day) * daysInMonth;
}

export function funnelWithDelta(
  current: FunnelCounts,
  previous: FunnelCounts | null,
): FunnelStepDelta[] {
  return funnelSteps.map((key, i) => {
    const before = i > 0 ? current[funnelSteps[i - 1] ?? key] : 0;
    return {
      key,
      label: funnelStepLabel[key],
      value: current[key],
      previous: previous ? previous[key] : null,
      fromPrevious: i > 0 && before > 0 ? (current[key] / before) * 100 : null,
    };
  });
}

export function lastMonthsWindow(today: string, months: number): Window {
  const [year, month] = today.split("-").map(Number);
  const start = new Date(Date.UTC(year ?? 2000, (month ?? 1) - months, 1));
  const end = new Date(Date.UTC(year ?? 2000, month ?? 1, 1));
  return { start, end };
}
