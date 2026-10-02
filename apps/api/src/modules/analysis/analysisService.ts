import { customersAggregate, customersByBucket } from "@/modules/customers/contract";
import {
  adSpendAggregate,
  adSpendByBucket,
  trafficAggregate,
  trafficByBucket,
} from "@/modules/marketing/contract";
import { type CostRule } from "@ecommerce/contracts/money";
import { expandCosts, costRulesFor } from "@/modules/money/contract";
import type { OrdersAggregate } from "@ecommerce/contracts/orders";
import { ordersAggregate, ordersByBucket } from "@/modules/orders/contract";
import type { SeriesPoint } from "@ecommerce/contracts/shared/metric.types";
import { metricValue } from "@ecommerce/contracts/shared/metricValue";
import type { PeriodSearch } from "@ecommerce/contracts/shared/period";
import {
  bucketWindows,
  resolvePeriod,
  truncUnit,
  type BucketWindow,
  type Window,
} from "@ecommerce/contracts/shared/periodWindow";
import type {
  AnalysisFacts,
  AnalysisScreen,
  AnalysisValues,
  AnalysisSearch,
} from "@ecommerce/contracts/analysis";
import { benchmarkFor } from "./benchmarks";
import { computeValues, driverDefinitions, metricDefinitions } from "@ecommerce/contracts/analysis";
import { narrativeOf } from "./narrative";

type Calendar = { inicio: string; fim: string };

type WindowSources = {
  orders: OrdersAggregate;
  traffic: { sessions: number; users: number; newUsers: number };
  ads: { spend: number; platformFee: number; clicks: number; impressions: number };
  customers: { customers: number; newCustomers: number };
};

const factsOf = (
  { orders, traffic, ads, customers }: WindowSources,
  rules: readonly CostRule[],
  calendar: Calendar,
): AnalysisFacts => ({
  revenue: orders.revenue,
  orders: orders.orders,
  capturedOrders: orders.capturedOrders,
  repeatOrders: orders.repeatOrders,
  items: orders.items,
  discounts: orders.discounts,
  productRevenue: orders.productRevenue,
  sessions: traffic.sessions,
  users: traffic.users,
  newUsers: traffic.newUsers,
  adSpend: ads.spend,
  adPlatformFee: ads.platformFee,
  clicks: ads.clicks,
  impressions: ads.impressions,
  customers: customers.customers,
  newCustomers: customers.newCustomers,
  salesMarketingCosts: expandCosts(rules, calendar, {
    ecommerce: orders.ecommerce,
    marketplace: orders.marketplace,
    adSpend: ads.spend,
  }).salesMarketing,
});

async function windowValues(
  clientId: string,
  w: Window,
  calendar: Calendar,
  rules: readonly CostRule[],
): Promise<AnalysisValues> {
  const [orders, traffic, ads, customers] = await Promise.all([
    ordersAggregate(clientId, w, null),
    trafficAggregate(clientId, w),
    adSpendAggregate(clientId, w),
    customersAggregate(clientId, w, null),
  ]);
  return computeValues(factsOf({ orders, traffic, ads, customers }, rules, calendar));
}

const emptyOrders: OrdersAggregate = {
  revenue: 0,
  orders: 0,
  captured: 0,
  capturedOrders: 0,
  cogs: 0,
  costCoverage: null,
  repeatOrders: 0,
  productRevenue: 0,
  items: 0,
  discounts: 0,
  shipping: 0,
  ecommerce: { orders: 0, revenue: 0 },
  marketplace: { orders: 0, revenue: 0 },
};

async function bucketValues(
  clientId: string,
  w: Window,
  unit: string,
  buckets: BucketWindow[],
  rules: readonly CostRule[],
): Promise<{ bucket: string; values: AnalysisValues }[]> {
  const [orders, traffic, ads, customers] = await Promise.all([
    ordersByBucket(clientId, w, unit, null),
    trafficByBucket(clientId, w, unit),
    adSpendByBucket(clientId, w, unit),
    customersByBucket(clientId, w, unit, null),
  ]);
  const byKey = <T extends { bucket: string }>(rows: T[]) =>
    new Map(rows.map((r) => [r.bucket, r]));
  const o = byKey(orders);
  const t = byKey(traffic);
  const a = byKey(ads);
  const c = byKey(customers);
  return buckets.map((b) => ({
    bucket: b.bucket,
    values: computeValues(
      factsOf(
        {
          orders: o.get(b.bucket) ?? emptyOrders,
          traffic: t.get(b.bucket) ?? { sessions: 0, users: 0, newUsers: 0 },
          ads: a.get(b.bucket) ?? { spend: 0, platformFee: 0, clicks: 0, impressions: 0 },
          customers: c.get(b.bucket) ?? { customers: 0, newCustomers: 0 },
        },
        rules,
        b,
      ),
    ),
  }));
}

const pointsOf = (
  rows: { bucket: string; values: AnalysisValues }[],
  key: keyof AnalysisValues,
): SeriesPoint[] => rows.map((r) => ({ bucket: r.bucket, value: r.values[key] ?? 0 }));

export async function analysisScreen(
  clientId: string,
  search: PeriodSearch & AnalysisSearch,
): Promise<AnalysisScreen> {
  const definition = metricDefinitions[search.metrica];
  const period = resolvePeriod(search);
  const unit = truncUnit[period.por];
  const rules = await costRulesFor(clientId);
  const currentBuckets = bucketWindows(period.current, period.por);
  const previousBuckets = period.previous ? bucketWindows(period.previous, period.por) : null;
  const previousCalendar = previousBuckets
    ? { inicio: previousBuckets[0]!.inicio, fim: previousBuckets[previousBuckets.length - 1]!.fim }
    : null;
  const [current, previous, currentRows, previousRows] = await Promise.all([
    windowValues(clientId, period.current, search, rules),
    period.previous && previousCalendar
      ? windowValues(clientId, period.previous, previousCalendar, rules)
      : null,
    bucketValues(clientId, period.current, unit, currentBuckets, rules),
    period.previous && previousBuckets
      ? bucketValues(clientId, period.previous, unit, previousBuckets, rules)
      : null,
  ]);
  const headline = metricValue(
    definition.unit,
    current[definition.key],
    previous?.[definition.key] ?? null,
  );
  const drivers = definition.drivers.map((key) => ({
    key,
    ...driverDefinitions[key],
    metric: metricValue(driverDefinitions[key].unit, current[key], previous?.[key] ?? null),
  }));
  const benchmark = benchmarkFor(definition.key, current[definition.key]);
  return {
    metric: definition,
    headline,
    series: {
      current: pointsOf(currentRows, definition.key),
      previous: previousRows ? pointsOf(previousRows, definition.key) : null,
    },
    narrative: narrativeOf(definition, headline, drivers, benchmark),
    drivers,
    comparison: previousCalendar,
  };
}
