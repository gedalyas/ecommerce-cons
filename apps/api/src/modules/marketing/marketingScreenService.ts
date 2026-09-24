import type { SalesPlatform } from "@ecommerce/database/enums";
import { currentDay } from "@/shared/config/clock";
import { dataSourcesFor } from "@/modules/connections/contract";
import { sectionFor } from "@/modules/consulting/contract";
import { marketingLiveKpis } from "./marketingLiveKpis";
import { ordersAggregate, ordersByBucket } from "@/modules/orders/contract";
import type { SeriesPoint } from "@ecommerce/contracts/shared/metric.types";
import { metricValue } from "@ecommerce/contracts/shared/metricValue";
import type { Channel, PeriodSearch } from "@ecommerce/contracts/shared/period";
import {
  bucketWindows,
  resolvePeriod,
  truncUnit,
  type Window,
} from "@ecommerce/contracts/shared/periodWindow";
import { adsByLevel, adsByPlatform, adsByPlatformBucket } from "./adsService";
import { marketingGeneral } from "./marketingGeneralService";
import { storeOrders, topSourceShare, utmSales } from "./attributionService";
import { discountAggregate, discountCodes, discountsByBucket } from "./discountsService";
import { regionPerformance } from "./regionsService";
import { marketingSocial } from "./socialService";
import { totalOf } from "./regionPerformance";
import type {
  AdPerformanceRow,
  MarketingCampaigns,
  MarketingCostLine,
  MarketingDiscounts,
  MarketingOverview,
  MarketingRegions,
  MarketingRetention,
  MarketingScreen,
  MarketingSummary,
  MarketingVisao,
  AdMetric,
  MarketingSearch,
} from "@ecommerce/contracts/marketing";
import { adPlatformLabel, cacPercent } from "@ecommerce/contracts/marketing";
import {
  channelPerformance,
  bestAndWorstByCost,
  deriveAdRow,
  discountMetrics,
  funnelTable,
  investmentBreakdown,
  percent,
  ratio,
  sumAdRows,
  type AdSums,
} from "./marketingMetrics";
import {
  adSpendAggregate,
  adSpendByBucket,
  trafficAggregate,
  trafficByBucket,
} from "./marketingService";

export type MarketingInput = PeriodSearch & MarketingSearch & { custos: MarketingCostLine[] };

const platformFor = (channel: Channel): SalesPlatform | null =>
  channel === "ecommerce" ? "ECOMMERCE" : channel === "marketplace" ? "MARKETPLACE" : null;

const costsTotal = (lines: readonly MarketingCostLine[]) => lines.reduce((s, l) => s + l.amount, 0);

const lifetimeWindow = (): Window => ({
  start: new Date("2000-01-01T00:00:00.000Z"),
  end: new Date(new Date(`${currentDay()}T00:00:00.000Z`).getTime() + 86_400_000),
});

const fill = (buckets: string[], points: Map<string, number>): SeriesPoint[] =>
  buckets.map((bucket) => ({ bucket, value: points.get(bucket) ?? 0 }));

type OverviewFacts = {
  revenue: number;
  orders: number;
  sessions: number;
  addToCart: number;
  paidStoreOrders: number;
  investment: number;
  topShare: number | null;
  topLabel: string | null;
};

async function overviewFacts(
  clientId: string,
  w: Window,
  platform: SalesPlatform | null,
  includeFee: boolean,
  costs: number,
): Promise<OverviewFacts> {
  const [orders, traffic, store, ads, top] = await Promise.all([
    ordersAggregate(clientId, w, platform),
    trafficAggregate(clientId, w),
    storeOrders(clientId, w),
    adSpendAggregate(clientId, w),
    topSourceShare(clientId, w),
  ]);
  return {
    revenue: orders.revenue,
    orders: orders.orders,
    sessions: traffic.sessions,
    addToCart: traffic.addToCart,
    paidStoreOrders: store.paidOrders,
    investment: ads.spend + (includeFee ? ads.platformFee : 0) + costs,
    topShare: top?.share ?? null,
    topLabel: top?.label ?? null,
  };
}

async function marketingOverview(
  clientId: string,
  input: MarketingInput,
): Promise<MarketingOverview> {
  const period = resolvePeriod(input);
  const platform = platformFor(input.canal);
  const costs = costsTotal(input.custos);
  const [cur, prev] = await Promise.all([
    overviewFacts(clientId, period.current, platform, input.incluirTaxa, costs),
    period.previous
      ? overviewFacts(clientId, period.previous, platform, input.incluirTaxa, 0)
      : null,
  ]);
  const of = (f: OverviewFacts) => ({
    conversionRate: percent(f.paidStoreOrders, f.sessions),
    aov: ratio(f.revenue, f.orders),
    cartAbandonment: percent(f.addToCart - f.paidStoreOrders, f.addToCart),
    cac: cacPercent(f.investment, f.revenue),
    roas: ratio(f.revenue, f.investment),
    adSpend: f.investment,
    topChannelShare: f.topShare,
  });
  const c = of(cur);
  const p = prev ? of(prev) : null;
  return {
    conversionRate: metricValue("percent", c.conversionRate, p?.conversionRate ?? null),
    aov: metricValue("currency", c.aov, p?.aov ?? null),
    cartAbandonment: metricValue("percent", c.cartAbandonment, p?.cartAbandonment ?? null),
    cac: metricValue("percent", c.cac, p?.cac ?? null),
    roas: metricValue("multiplier", c.roas, p?.roas ?? null),
    adSpend: metricValue("currency", c.adSpend, p?.adSpend ?? null),
    topChannelShare: metricValue("percent", c.topChannelShare, p?.topChannelShare ?? null),
    topChannel: cur.topLabel,
  };
}

async function marketingSummary(
  clientId: string,
  input: MarketingInput,
): Promise<MarketingSummary> {
  const period = resolvePeriod(input);
  const unit = truncUnit[period.por];
  const platform = platformFor(input.canal);
  const buckets = bucketWindows(period.current, period.por).map((b) => b.bucket);
  const lifetime = lifetimeWindow();
  const [
    orders,
    traffic,
    store,
    platforms,
    ordersB,
    trafficB,
    adsB,
    lifetimeTraffic,
    lifetimeStore,
    utm,
  ] = await Promise.all([
    ordersAggregate(clientId, period.current, null),
    trafficAggregate(clientId, period.current),
    storeOrders(clientId, period.current),
    adsByPlatform(clientId, period.current),
    ordersByBucket(clientId, period.current, unit, platform),
    trafficByBucket(clientId, period.current, unit),
    adSpendByBucket(clientId, period.current, unit),
    trafficAggregate(clientId, lifetime),
    storeOrders(clientId, lifetime),
    utmSales(clientId, period.current, platform, input.utm),
  ]);

  const media = platforms.reduce(
    (s, p) => s + p.spend + (input.incluirTaxa ? p.platformFee : 0),
    0,
  );
  const channels = channelPerformance({
    ecommerce: { ...orders.ecommerce, sessions: traffic.sessions },
    marketplace: orders.marketplace,
    media,
    costLines: input.custos,
  });
  const breakdown = investmentBreakdown(
    platforms.map((p) => ({
      key: p.platform,
      label: adPlatformLabel[p.platform],
      spend: p.spend,
      platformFee: p.platformFee,
    })),
    input.incluirTaxa,
    input.custos,
  );

  const ordersMap = new Map(ordersB.map((o) => [o.bucket, o]));
  const adsMap = new Map(adsB.map((a) => [a.bucket, a]));
  const trafficMap = new Map(trafficB.map((t) => [t.bucket, t]));
  const investmentAt = (bucket: string) => {
    const a = adsMap.get(bucket);
    return a ? a.spend + (input.incluirTaxa ? a.platformFee : 0) : 0;
  };
  const investmentMetric = (bucket: string): number => {
    const o = ordersMap.get(bucket);
    const revenue = o?.revenue ?? 0;
    const invest = investmentAt(bucket);
    switch (input.metricaInvest) {
      case "totalSold":
        return revenue;
      case "adSpend":
        return invest;
      case "roas":
        return ratio(revenue, invest) ?? 0;
      case "roi":
        return invest > 0 ? ((revenue - invest) / invest) * 100 : 0;
      case "cpa":
        return ratio(invest, o?.orders ?? 0) ?? 0;
      case "cac":
        return cacPercent(invest, revenue) ?? 0;
    }
  };
  const sessionsAt = (bucket: string) => {
    const t = trafficMap.get(bucket);
    return input.base === "usuarios" ? (t?.users ?? 0) : (t?.sessions ?? 0);
  };
  const sessionsMetric = (bucket: string): number => {
    const o = ordersMap.get(bucket);
    const revenue = o?.revenue ?? 0;
    const base = sessionsAt(bucket);
    switch (input.metricaSessoes) {
      case "totalSold":
        return revenue;
      case "conversionRate":
        return percent(o?.ecommerce.orders ?? 0, base) ?? 0;
      case "revenuePerSession":
        return ratio(revenue, base) ?? 0;
      case "costPerSession":
        return ratio(investmentAt(bucket), base) ?? 0;
    }
  };

  const funnel = funnelTable(
    {
      sessions: traffic.sessions,
      viewItem: traffic.viewItem,
      addToCart: traffic.addToCart,
      checkout: traffic.beginCheckout,
      orders: store.orders,
      paidOrders: store.paidOrders,
    },
    {
      sessions: lifetimeTraffic.sessions,
      viewItem: lifetimeTraffic.viewItem,
      addToCart: lifetimeTraffic.addToCart,
      checkout: lifetimeTraffic.beginCheckout,
      orders: lifetimeStore.orders,
      paidOrders: lifetimeStore.paidOrders,
    },
  );

  return {
    channels,
    investmentBreakdown: breakdown,
    investmentSeries: fill(buckets, new Map(buckets.map((b) => [b, investmentAt(b)]))),
    investmentMetricSeries: fill(buckets, new Map(buckets.map((b) => [b, investmentMetric(b)]))),
    sessionsSeries: fill(buckets, new Map(buckets.map((b) => [b, sessionsAt(b)]))),
    sessionsMetricSeries: fill(buckets, new Map(buckets.map((b) => [b, sessionsMetric(b)]))),
    funnel,
    utmSales: utm,
  };
}

const adMetricOf = (row: AdPerformanceRow, metric: AdMetric): number => row[metric] ?? 0;

async function marketingCampaigns(
  clientId: string,
  input: MarketingInput,
): Promise<MarketingCampaigns> {
  const period = resolvePeriod(input);
  const unit = truncUnit[period.por];
  const buckets = bucketWindows(period.current, period.por).map((b) => b.bucket);
  const [platformSums, levelSums, campaignSums, perBucket] = await Promise.all([
    adsByPlatform(clientId, period.current),
    adsByLevel(clientId, period.current, input.nivel, input.plataforma),
    adsByLevel(clientId, period.current, "campanha", input.plataforma),
    adsByPlatformBucket(clientId, period.current, unit),
  ]);
  const derive = (s: AdSums) => deriveAdRow(s, input.incluirTaxa);
  const platforms = platformSums.map(derive);
  const total = derive(sumAdRows(platformSums, "total", "Total"));
  const rows = levelSums.map(derive);
  const campaigns = campaignSums.map(derive).filter((c) => c.spend > 0);
  const { best, worst } = bestAndWorstByCost(campaigns);

  const platformSeries = platformSums.map((p) => {
    const points = new Map<string, number>();
    for (const b of perBucket) {
      if (b.platform !== p.platform) continue;
      const row = derive({
        id: b.platform,
        name: b.platform,
        platform: b.platform,
        campaignName: null,
        adsetName: null,
        spend: b.spend,
        platformFee: b.platform_fee,
        orders: b.orders,
        impressions: b.impressions,
        clicks: b.clicks,
      });
      points.set(b.bucket, adMetricOf(row, input.metricaAds));
    }
    return { key: p.platform, label: adPlatformLabel[p.platform], points: fill(buckets, points) };
  });

  return { platforms, total, platformSeries, rows, best, worst };
}

async function marketingDiscounts(
  clientId: string,
  input: MarketingInput,
): Promise<MarketingDiscounts> {
  const period = resolvePeriod(input);
  const unit = truncUnit[period.por];
  const platform = platformFor(input.canal);
  const buckets = bucketWindows(period.current, period.por).map((b) => b.bucket);
  const [current, previous, codes, series] = await Promise.all([
    discountAggregate(clientId, period.current, platform),
    period.previous ? discountAggregate(clientId, period.previous, platform) : null,
    discountCodes(clientId, period.current, platform),
    discountsByBucket(clientId, period.current, unit, platform),
  ]);
  return {
    metrics: discountMetrics(current, previous),
    codes,
    discountsSeries: fill(buckets, new Map(series.map((s) => [s.bucket, s.discounts]))),
    couponRevenueSeries: fill(buckets, new Map(series.map((s) => [s.bucket, s.couponRevenue]))),
  };
}

export async function marketingScreen(
  clientId: string,
  input: MarketingInput,
): Promise<MarketingScreen> {
  switch (input.aba) {
    case "geral":
      return { aba: "geral", general: await marketingGeneral(clientId, input) };
    case "visao":
      throw new Error("The visão tab is assembled by the controller (it needs the retention)");
    case "resumo":
      return { aba: "resumo", summary: await marketingSummary(clientId, input) };
    case "campanhas":
      return { aba: "campanhas", campaigns: await marketingCampaigns(clientId, input) };
    case "descontos":
      return { aba: "descontos", discounts: await marketingDiscounts(clientId, input) };
    case "regioes":
      return { aba: "regioes", regions: await marketingRegions(clientId, input) };
    case "social":
      return { aba: "social", social: await marketingSocial(clientId, input) };
  }
}

export async function marketingVisao(
  clientId: string,
  input: MarketingInput,
  retention: MarketingRetention,
  canEdit: boolean,
): Promise<MarketingVisao> {
  const [overview, sources, social] = await Promise.all([
    marketingOverview(clientId, input),
    dataSourcesFor(clientId),
    marketingSocial(clientId, input),
  ]);
  const section = await sectionFor(
    clientId,
    "marketing",
    marketingLiveKpis(overview, retention, social),
    canEdit,
  );
  const staleSources = sources
    .filter((s) => s.status === "ERROR")
    .map((s) => ({ name: s.name, syncLabel: s.syncLabel }));
  return { overview, section, staleSources, retention };
}

async function marketingRegions(
  clientId: string,
  input: MarketingInput,
): Promise<MarketingRegions> {
  const period = resolvePeriod(input);
  const rows = await regionPerformance(clientId, period.current, input.incluirTaxa);
  return { rows, total: totalOf(rows) };
}
