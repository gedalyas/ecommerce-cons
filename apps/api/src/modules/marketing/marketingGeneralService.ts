import { currentDay } from "@/shared/config/clock";
import { ordersAggregate, ordersByBucket } from "@/modules/orders/contract";
import {
  adPlatformLabel,
  type MarketingCostLine,
  type MarketingGeneral,
  type PlatformCard,
} from "@ecommerce/contracts/marketing";
import { metricValue } from "@ecommerce/contracts/shared/metricValue";
import type { Channel, PeriodSearch } from "@ecommerce/contracts/shared/period";
import type { SalesPlatform } from "@ecommerce/database/enums";
import {
  bucketWindows,
  resolvePeriod,
  truncUnit,
  type Window,
} from "@ecommerce/contracts/shared/periodWindow";
import { adsByPlatform } from "./adsService";
import { storeOrders } from "./attributionService";
import {
  funnelWithDelta,
  investedOf,
  monthEndProjection,
  salesInvestmentPoints,
  trafficPoints,
} from "./generalMetrics";
import { deriveAdRow, percent, ratio, type AdSums } from "./marketingMetrics";
import {
  adSpendAggregate,
  adSpendByBucket,
  trafficAggregate,
  trafficByBucket,
} from "./marketingService";

type GeneralInput = PeriodSearch & { incluirTaxa: boolean; custos: MarketingCostLine[] };

type FactOptions = { fee: boolean; platform: SalesPlatform | null };

const platformFor = (channel: Channel): SalesPlatform | null =>
  channel === "ecommerce" ? "ECOMMERCE" : channel === "marketplace" ? "MARKETPLACE" : null;

const dayOf = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const nextDay = (iso: string) => new Date(dayOf(iso).getTime() + 86_400_000);

const yearWindow = (today: string): Window => ({
  start: dayOf(`${today.slice(0, 4)}-01-01`),
  end: nextDay(today),
});
const monthWindow = (today: string): Window => ({
  start: dayOf(`${today.slice(0, 7)}-01`),
  end: nextDay(today),
});

function lastMonthsWindow(today: string, months: number): Window {
  const [year, month] = today.split("-").map(Number);
  const start = new Date(Date.UTC(year ?? 2000, (month ?? 1) - months, 1));
  const end = new Date(Date.UTC(year ?? 2000, month ?? 1, 1));
  return { start, end };
}

async function windowFacts(clientId: string, w: Window, { fee, platform }: FactOptions) {
  const [orders, ads, traffic, store] = await Promise.all([
    ordersAggregate(clientId, w, platform),
    adSpendAggregate(clientId, w),
    trafficAggregate(clientId, w),
    storeOrders(clientId, w),
  ]);
  return { orders, invested: investedOf(ads, fee), traffic, store };
}

type Facts = Awaited<ReturnType<typeof windowFacts>>;

const kpisOf = (f: Facts, costs: number, media: boolean) => ({
  sold: f.orders.revenue,
  invested: f.invested,
  roas: media ? ratio(f.orders.ecommerce.revenue, f.invested) : null,
  mer: media ? ratio(f.orders.revenue, f.invested + costs) : null,
  orders: f.orders.orders,
  aov: ratio(f.orders.revenue, f.orders.orders),
  conversionRate: percent(f.orders.ecommerce.orders, f.traffic.sessions),
  sessions: f.traffic.sessions,
});

const funnelCounts = (f: Facts) => ({
  sessions: f.traffic.sessions,
  viewItem: f.traffic.viewItem,
  addToCart: f.traffic.addToCart,
  checkout: f.traffic.beginCheckout,
  orders: f.store.orders,
  paidOrders: f.store.paidOrders,
});

function platformCard(
  current: AdSums,
  previous: AdSums | undefined,
  includeFee: boolean,
): PlatformCard {
  const c = deriveAdRow(current, includeFee);
  const p = previous ? deriveAdRow(previous, includeFee) : null;
  return {
    platform: current.platform,
    label: adPlatformLabel[current.platform],
    spend: metricValue("currency", c.spend, p?.spend ?? null),
    cpc: metricValue("currency", c.cpc, p?.cpc ?? null),
    conversions: metricValue("count", c.orders, p?.orders ?? null),
    costPerConversion: metricValue("currency", c.cpa, p?.cpa ?? null),
  };
}

async function series(
  clientId: string,
  w: Window,
  granularity: "mes" | PeriodSearch["por"],
  { fee, platform }: FactOptions,
) {
  const unit = truncUnit[granularity];
  const buckets = bucketWindows(w, granularity).map((b) => b.bucket);
  const [orders, ads, traffic] = await Promise.all([
    ordersByBucket(clientId, w, unit, platform),
    adSpendByBucket(clientId, w, unit),
    trafficByBucket(clientId, w, unit),
  ]);
  return {
    sales: salesInvestmentPoints(buckets, orders, ads, fee),
    traffic: trafficPoints(buckets, traffic, orders),
  };
}

export async function marketingGeneral(
  clientId: string,
  input: GeneralInput,
): Promise<MarketingGeneral> {
  const today = currentDay();
  const period = resolvePeriod(input);
  const costs = input.custos.reduce((s, l) => s + l.amount, 0);
  const opts = { fee: input.incluirTaxa, platform: platformFor(input.canal) };
  const [cur, prev, year, month, monthly, daily, platforms, prevPlatforms] = await Promise.all([
    windowFacts(clientId, period.current, opts),
    period.previous ? windowFacts(clientId, period.previous, opts) : null,
    windowFacts(clientId, yearWindow(today), opts),
    windowFacts(clientId, monthWindow(today), opts),
    series(clientId, lastMonthsWindow(today, 12), "mes", opts),
    series(clientId, period.current, input.por, opts),
    adsByPlatform(clientId, period.current),
    period.previous ? adsByPlatform(clientId, period.previous) : [],
  ]);
  const c = kpisOf(cur, costs, opts.platform !== "MARKETPLACE");
  const p = prev ? kpisOf(prev, costs, opts.platform !== "MARKETPLACE") : null;
  const prevByPlatform = new Map(prevPlatforms.map((s) => [s.platform, s]));
  return {
    kpis: {
      sold: metricValue("currency", c.sold, p?.sold ?? null),
      invested: metricValue("currency", c.invested, p?.invested ?? null),
      roas: metricValue("multiplier", c.roas, p?.roas ?? null),
      mer: metricValue("multiplier", c.mer, p?.mer ?? null),
      orders: metricValue("count", c.orders, p?.orders ?? null),
      aov: metricValue("currency", c.aov, p?.aov ?? null),
      conversionRate: metricValue("percent", c.conversionRate, p?.conversionRate ?? null),
      sessions: metricValue("count", c.sessions, p?.sessions ?? null),
    },
    year: {
      sold: year.orders.revenue,
      invested: year.invested,
      roas: kpisOf(year, 0, opts.platform !== "MARKETPLACE").roas,
    },
    projection: {
      month: today.slice(0, 7),
      sold: monthEndProjection(month.orders.revenue, today),
      invested: monthEndProjection(month.invested, today),
    },
    monthly: monthly.sales,
    daily: daily.sales,
    trafficMonthly: monthly.traffic,
    trafficDaily: daily.traffic,
    funnel: funnelWithDelta(funnelCounts(cur), prev ? funnelCounts(prev) : null),
    platforms: platforms.map((s) => platformCard(s, prevByPlatform.get(s.platform), opts.fee)),
  };
}
