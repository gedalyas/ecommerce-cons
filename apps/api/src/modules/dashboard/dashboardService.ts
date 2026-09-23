import type { SalesPlatform } from "@ecommerce/database/enums";
import { alertsFor } from "@/modules/alerts/contract";
import { dataSourcesFor } from "@/modules/connections/contract";
import { milestoneCriteriaFor, openRecommendationsFor } from "@/modules/consulting/contract";
import { customersAggregate, customersByBucket } from "@/modules/customers/contract";
import {
  adSpendAggregate,
  adSpendByBucket,
  trafficAggregate,
  trafficByBucket,
} from "@/modules/marketing/contract";
import { type CostActivity, type CostRule } from "@ecommerce/contracts/money";
import { expandCosts, costRulesFor } from "@/modules/money/contract";
import type { OrdersAggregate, OrdersBucket } from "@ecommerce/contracts/orders";
import type { AdSpendBucket, TrafficAggregate } from "@ecommerce/contracts/marketing";
import { ordersAggregate, ordersByBucket, revenueBySource } from "@/modules/orders/contract";
import { productSales } from "@/modules/products/contract";
import type { AuthContext } from "@/shared/http/auth.types";
import type { Series } from "@ecommerce/contracts/shared/metric.types";
import { metricValue } from "@ecommerce/contracts/shared/metricValue";
import type { Channel, PeriodSearch } from "@ecommerce/contracts/shared/period";
import {
  bucketWindows,
  resolvePeriod,
  truncUnit,
  type BucketWindow,
  type Window,
} from "@ecommerce/contracts/shared/periodWindow";
import {
  dashboardMetricDefinitions,
  dashboardMetricKeys,
  type DashboardMetricKey,
  type DashboardOverview,
} from "@ecommerce/contracts/dashboard";
import {
  channelSplitOf,
  customerMixOf,
  funnelOf,
  paidMediaOf,
  topProductsOf,
} from "./dashboardAnalyses";
import { fidelityFor } from "./dashboardFidelity";
import { dashboardLayoutFor } from "./dashboardLayoutService";
import {
  computeDashboardMetrics,
  type DashboardFacts,
  type DashboardValues,
} from "./dashboardMetrics";

const platformFor = (channel: Channel): SalesPlatform | null =>
  channel === "ecommerce" ? "ECOMMERCE" : channel === "marketplace" ? "MARKETPLACE" : null;

const activityFor = (orders: OrdersAggregate, adSpend: number): CostActivity => ({
  ecommerce: orders.ecommerce,
  marketplace: orders.marketplace,
  adSpend,
});

type WindowFacts = { facts: DashboardFacts; traffic: TrafficAggregate | null };

async function windowFacts(
  clientId: string,
  w: Window,
  channel: Channel,
  rules: readonly CostRule[],
  calendar: { inicio: string; fim: string },
): Promise<WindowFacts> {
  const platform = platformFor(channel);
  const mediaApplies = channel !== "marketplace";
  const [orders, customers, traffic, ads] = await Promise.all([
    ordersAggregate(clientId, w, platform),
    customersAggregate(clientId, w, platform),
    mediaApplies ? trafficAggregate(clientId, w) : null,
    mediaApplies ? adSpendAggregate(clientId, w) : null,
  ]);
  const adSpend = ads?.spend ?? 0;
  return {
    facts: {
      revenue: orders.revenue,
      orders: orders.orders,
      ecommerceOrders: orders.ecommerce.orders,
      cogs: orders.cogs,
      repeatOrders: orders.repeatOrders,
      customers: customers.customers,
      newCustomers: customers.newCustomers,
      sessions: traffic?.sessions ?? 0,
      adSpend,
      adPlatformFee: ads?.platformFee ?? 0,
      costs: expandCosts(rules, calendar, activityFor(orders, adSpend)),
    },
    traffic,
  };
}

type BucketRow = { bucket: string; facts: DashboardFacts };
type BucketFacts = { rows: BucketRow[]; orders: OrdersBucket[]; ads: AdSpendBucket[] };

async function bucketFacts(
  clientId: string,
  w: Window,
  buckets: BucketWindow[],
  unit: string,
  channel: Channel,
  rules: readonly CostRule[],
): Promise<BucketFacts> {
  const platform = platformFor(channel);
  const mediaApplies = channel !== "marketplace";
  const [orders, customers, traffic, ads] = await Promise.all([
    ordersByBucket(clientId, w, unit, platform),
    customersByBucket(clientId, w, unit, platform),
    mediaApplies ? trafficByBucket(clientId, w, unit) : [],
    mediaApplies ? adSpendByBucket(clientId, w, unit) : [],
  ]);
  const byKey = <T extends { bucket: string }>(rows: T[]) =>
    new Map(rows.map((r) => [r.bucket, r]));
  const ordersMap = byKey(orders);
  const customersMap = byKey(customers);
  const trafficMap = byKey(traffic);
  const adsMap = byKey(ads);
  const emptyOrders: OrdersAggregate = {
    revenue: 0,
    orders: 0,
    captured: 0,
    capturedOrders: 0,
    cogs: 0,
    repeatOrders: 0,
    productRevenue: 0,
    items: 0,
    discounts: 0,
    shipping: 0,
    ecommerce: { orders: 0, revenue: 0 },
    marketplace: { orders: 0, revenue: 0 },
  };

  const rows = buckets.map((b) => {
    const o = ordersMap.get(b.bucket) ?? emptyOrders;
    const c = customersMap.get(b.bucket);
    const t = trafficMap.get(b.bucket);
    const a = adsMap.get(b.bucket);
    const adSpend = a?.spend ?? 0;
    return {
      bucket: b.bucket,
      facts: {
        revenue: o.revenue,
        orders: o.orders,
        ecommerceOrders: o.ecommerce.orders,
        cogs: o.cogs,
        repeatOrders: o.repeatOrders,
        customers: c?.customers ?? 0,
        newCustomers: c?.newCustomers ?? 0,
        sessions: t?.sessions ?? 0,
        adSpend,
        adPlatformFee: a?.platformFee ?? 0,
        costs: expandCosts(rules, b, activityFor(o, adSpend)),
      },
    };
  });
  return { rows, orders, ads };
}

const seriesFrom = (
  current: { bucket: string; values: DashboardValues }[],
  previous: { bucket: string; values: DashboardValues }[] | null,
): Record<DashboardMetricKey, Series> => {
  const pick = (rows: { bucket: string; values: DashboardValues }[], key: DashboardMetricKey) =>
    rows.map((r) => ({ bucket: r.bucket, value: r.values[key] ?? 0 }));
  return Object.fromEntries(
    dashboardMetricKeys.map((key) => [
      key,
      { current: pick(current, key), previous: previous ? pick(previous, key) : null },
    ]),
  ) as Record<DashboardMetricKey, Series>;
};

type OverviewFacts = {
  current: WindowFacts;
  previous: WindowFacts | null;
  currentByBucket: BucketFacts;
  previousByBucket: BucketFacts | null;
};

async function overviewFacts(
  clientId: string,
  search: PeriodSearch,
  period: ReturnType<typeof resolvePeriod>,
  rules: readonly CostRule[],
): Promise<OverviewFacts> {
  const unit = truncUnit[period.por];
  const channel = search.canal;
  const currentBuckets = bucketWindows(period.current, period.por);
  const previousBuckets = period.previous ? bucketWindows(period.previous, period.por) : null;
  const previousCalendar = previousBuckets
    ? { inicio: previousBuckets[0]!.inicio, fim: previousBuckets[previousBuckets.length - 1]!.fim }
    : null;
  const [current, previous, currentByBucket, previousByBucket] = await Promise.all([
    windowFacts(clientId, period.current, channel, rules, {
      inicio: search.inicio,
      fim: search.fim,
    }),
    period.previous && previousCalendar
      ? windowFacts(clientId, period.previous, channel, rules, previousCalendar)
      : null,
    bucketFacts(clientId, period.current, currentBuckets, unit, channel, rules),
    period.previous && previousBuckets
      ? bucketFacts(clientId, period.previous, previousBuckets, unit, channel, rules)
      : null,
  ]);
  return { current, previous, currentByBucket, previousByBucket };
}

type ValueRow = { bucket: string; values: DashboardValues };

const valueRowsOf = (byBucket: BucketFacts, channel: Channel): ValueRow[] =>
  byBucket.rows.map((b) => ({
    bucket: b.bucket,
    values: computeDashboardMetrics(b.facts, channel),
  }));

const milestoneOf = (criteria: DashboardOverview["milestone"]["criteria"]) => ({
  criteria,
  achieved: criteria.filter((c) => c.achieved).length,
  total: criteria.length,
});

const metricsOf = (
  values: DashboardValues,
  previousValues: DashboardValues | null,
  sources: Awaited<ReturnType<typeof dataSourcesFor>>,
): DashboardOverview["metrics"] =>
  dashboardMetricDefinitions.map((definition) => {
    const { fidelity, note } = fidelityFor(definition.key, sources);
    return {
      ...definition,
      metric: metricValue(
        definition.unit,
        values[definition.key],
        previousValues?.[definition.key] ?? null,
      ),
      fidelity,
      fidelityNote: note,
    };
  });

const matrixOf = (currentRows: ValueRow[]): DashboardOverview["matrix"] => ({
  buckets: currentRows.map((r) => r.bucket),
  rows: dashboardMetricDefinitions.map((d) => ({
    key: d.key,
    label: d.label,
    unit: d.unit,
    values: currentRows.map((r) => r.values[d.key]),
  })),
});

export async function dashboardOverview(
  auth: AuthContext,
  search: PeriodSearch,
): Promise<DashboardOverview> {
  const { clientId } = auth;
  const period = resolvePeriod(search);
  const channel = search.canal;
  const platform = platformFor(channel);
  const [rules, sources, alerts, criteria, recommendations, layout] = await Promise.all([
    costRulesFor(clientId),
    dataSourcesFor(clientId),
    alertsFor(clientId),
    milestoneCriteriaFor(clientId),
    openRecommendationsFor(clientId),
    dashboardLayoutFor(auth.userId, clientId),
  ]);
  const [facts, bySource, products] = await Promise.all([
    overviewFacts(clientId, search, period, rules),
    revenueBySource(clientId, period.current, platform),
    productSales(clientId, period.current, platform, null),
  ]);
  const { current, previous, currentByBucket, previousByBucket } = facts;

  const values = computeDashboardMetrics(current.facts, channel);
  const previousValues = previous ? computeDashboardMetrics(previous.facts, channel) : null;
  const currentRows = valueRowsOf(currentByBucket, channel);
  const previousRows = previousByBucket ? valueRowsOf(previousByBucket, channel) : null;
  const buckets = currentRows.map((r) => r.bucket);

  return {
    layout,
    alerts,
    milestone: milestoneOf(criteria),
    recommendations,
    metrics: metricsOf(values, previousValues, sources),
    series: seriesFrom(currentRows, previousRows),
    bySource,
    matrix: matrixOf(currentRows),
    channelSplit: channelSplitOf(buckets, currentByBucket.orders),
    topProducts: topProductsOf(products),
    customerMix: customerMixOf(current.facts),
    funnel: funnelOf(current.traffic, current.facts.orders),
    paidMedia: paidMediaOf(currentRows, currentByBucket.ads),
  };
}
