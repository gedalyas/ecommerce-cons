/**
 * Dashboard orchestrator: reads the facts through the other modules'
 * contracts, hands them to the pure core and shapes the screen payload.
 * Server-only.
 */
import type { SalesPlatform } from "@/generated/prisma/enums";
import { prismaClient } from "@/shared/dependencies/prismaClient";
import { dataSourcesFor } from "@/modules/connections/contract.server";
import { customersAggregate, customersByBucket } from "@/modules/customers/contract.server";
import {
  adSpendAggregate,
  adSpendByBucket,
  trafficAggregate,
  trafficByBucket,
} from "@/modules/marketing/contract.server";
import { expandCosts, type CostActivity, type CostRule } from "@/modules/money/contract";
import { costRulesFor } from "@/modules/money/contract.server";
import type { OrdersAggregate } from "@/modules/orders/contract";
import { ordersAggregate, ordersByBucket, revenueBySource } from "@/modules/orders/contract.server";
import type { Series } from "@/shared/models/types/metric.types";
import { metricValue } from "@/shared/utils/metricFormat";
import type { Channel, PeriodSearch } from "@/shared/utils/period";
import {
  bucketWindows,
  resolvePeriod,
  truncUnit,
  type BucketWindow,
  type Window,
} from "@/shared/utils/periodWindow";
import {
  dashboardMetricDefinitions,
  dashboardMetricKeys,
  type DashboardMetricKey,
  type DashboardOverview,
} from "./dashboard.types";
import { fidelityFor } from "./dashboardFidelity";
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

async function clientIdFor(slug: string) {
  const client = await prismaClient.client.findUnique({ where: { slug }, select: { id: true } });
  if (!client) throw new Error(`Unknown client "${slug}"`);
  return client.id;
}

/** Facts of a whole window. Marketplaces have no traffic and no ad spend. */
async function windowFacts(
  clientId: string,
  w: Window,
  channel: Channel,
  rules: readonly CostRule[],
  calendar: { inicio: string; fim: string },
): Promise<DashboardFacts> {
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
  };
}

/** Facts per bucket, zero-filled so every bucket of the window is present. */
async function bucketFacts(
  clientId: string,
  w: Window,
  buckets: BucketWindow[],
  unit: string,
  channel: Channel,
  rules: readonly CostRule[],
): Promise<{ bucket: string; facts: DashboardFacts }[]> {
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
    items: 0,
    discounts: 0,
    shipping: 0,
    ecommerce: { orders: 0, revenue: 0 },
    marketplace: { orders: 0, revenue: 0 },
  };

  return buckets.map((b) => {
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

export async function dashboardOverview(
  clientSlug: string,
  search: PeriodSearch,
): Promise<DashboardOverview> {
  const clientId = await clientIdFor(clientSlug);
  const period = resolvePeriod(search);
  const unit = truncUnit[period.por];
  const channel = search.canal;
  const [rules, sources] = await Promise.all([costRulesFor(clientId), dataSourcesFor(clientId)]);

  const currentBuckets = bucketWindows(period.current, period.por);
  const previousBuckets = period.previous ? bucketWindows(period.previous, period.por) : null;
  const previousCalendar = previousBuckets
    ? { inicio: previousBuckets[0]!.inicio, fim: previousBuckets[previousBuckets.length - 1]!.fim }
    : null;

  const [current, previous, currentByBucket, previousByBucket, bySource] = await Promise.all([
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
    revenueBySource(clientId, period.current, platformFor(channel)),
  ]);

  const values = computeDashboardMetrics(current, channel);
  const previousValues = previous ? computeDashboardMetrics(previous, channel) : null;
  const currentRows = currentByBucket.map((b) => ({
    bucket: b.bucket,
    values: computeDashboardMetrics(b.facts, channel),
  }));
  const previousRows = previousByBucket
    ? previousByBucket.map((b) => ({
        bucket: b.bucket,
        values: computeDashboardMetrics(b.facts, channel),
      }))
    : null;

  return {
    metrics: dashboardMetricDefinitions.map((definition) => {
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
    }),
    series: seriesFrom(currentRows, previousRows),
    bySource,
    matrix: {
      buckets: currentRows.map((r) => r.bucket),
      rows: dashboardMetricDefinitions.map((d) => ({
        key: d.key,
        label: d.label,
        unit: d.unit,
        values: currentRows.map((r) => r.values[d.key]),
      })),
    },
  };
}
