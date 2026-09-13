import type { BreakdownSlice, MetricValue } from "@ecommerce/contracts/shared/metric.types";
import { metricValue } from "@ecommerce/contracts/shared/metricValue";
import type {
  AdPerformanceRow,
  ChannelPerformanceRow,
  DiscountMetric,
  FunnelRatioRow,
  FunnelStepValue,
  MarketingCostLine,
} from "@ecommerce/contracts/marketing";
import {
  benchmarkVerdict,
  funnelRatio,
  funnelRatios,
  funnelStepLabel,
  funnelSteps,
  roasQuality,
  type FunnelCounts,
} from "@ecommerce/contracts/marketing";

export const ratio = (numerator: number, denominator: number) =>
  denominator > 0 ? numerator / denominator : null;
export const percent = (numerator: number, denominator: number) =>
  denominator > 0 ? (numerator / denominator) * 100 : null;

/** Raw sums of a media row before the ratios are derived. */
export type AdSums = {
  id: string;
  name: string;
  platform: AdPerformanceRow["platform"];
  campaignName: string | null;
  adsetName: string | null;
  spend: number;
  platformFee: number;
  revenue: number;
  orders: number;
  impressions: number;
  clicks: number;
};

/** ROAS, CPA, CPM, CPC and CTR from the sums; the fee joins the spend when asked. */
export function deriveAdRow(sums: AdSums, includeFee: boolean): AdPerformanceRow {
  const spend = sums.spend + (includeFee ? sums.platformFee : 0);
  const roas = ratio(sums.revenue, spend);
  return {
    ...sums,
    spend,
    roas,
    roasQuality: roasQuality(roas),
    cpa: ratio(spend, sums.orders),
    cpm: sums.impressions > 0 ? (spend / sums.impressions) * 1000 : null,
    cpc: ratio(spend, sums.clicks),
    ctr: percent(sums.clicks, sums.impressions),
  };
}

export function sumAdRows(rows: readonly AdSums[], id: string, name: string): AdSums {
  const total: AdSums = {
    id,
    name,
    platform: rows[0]?.platform ?? "META",
    campaignName: null,
    adsetName: null,
    spend: 0,
    platformFee: 0,
    revenue: 0,
    orders: 0,
    impressions: 0,
    clicks: 0,
  };
  for (const r of rows) {
    total.spend += r.spend;
    total.platformFee += r.platformFee;
    total.revenue += r.revenue;
    total.orders += r.orders;
    total.impressions += r.impressions;
    total.clicks += r.clicks;
  }
  return total;
}

export type ChannelFacts = {
  ecommerce: { orders: number; revenue: number; sessions: number };
  marketplace: { orders: number; revenue: number };
  media: number;
  costLines: readonly MarketingCostLine[];
};

const costsOf = (lines: readonly MarketingCostLine[], unit: MarketingCostLine["businessUnit"]) =>
  lines.filter((l) => l.businessUnit === unit).reduce((s, l) => s + l.amount, 0);

const channelRow = (
  key: ChannelPerformanceRow["key"],
  label: string,
  investment: number,
  revenue: number,
  orders: number,
  sessions: number | null,
): ChannelPerformanceRow => ({
  key,
  label,
  investment,
  revenue,
  orders,
  roi: investment > 0 ? ((revenue - investment) / investment) * 100 : null,
  roas: ratio(revenue, investment),
  cpa: investment > 0 ? ratio(investment, orders) : null,
  conversionRate: sessions == null ? null : percent(orders, sessions),
});

/** E-commerce, marketplace and total rows; costs shared by both units are split by revenue. */
export function channelPerformance(facts: ChannelFacts): ChannelPerformanceRow[] {
  const both = costsOf(facts.costLines, "BOTH");
  const totalRevenue = facts.ecommerce.revenue + facts.marketplace.revenue;
  const ecommerceShare = totalRevenue > 0 ? facts.ecommerce.revenue / totalRevenue : 1;
  const ecommerceInvestment =
    facts.media + costsOf(facts.costLines, "ECOMMERCE") + both * ecommerceShare;
  const marketplaceInvestment =
    costsOf(facts.costLines, "MARKETPLACE") + both * (1 - ecommerceShare);
  const { ecommerce, marketplace } = facts;
  return [
    channelRow(
      "ecommerce",
      "E-commerce",
      ecommerceInvestment,
      ecommerce.revenue,
      ecommerce.orders,
      ecommerce.sessions,
    ),
    channelRow(
      "marketplace",
      "Marketplace",
      marketplaceInvestment,
      marketplace.revenue,
      marketplace.orders,
      null,
    ),
    channelRow(
      "total",
      "Total",
      ecommerceInvestment + marketplaceInvestment,
      totalRevenue,
      ecommerce.orders + marketplace.orders,
      ecommerce.sessions,
    ),
  ];
}

/** Media by platform, the platform fee and every cost line, as shares of the whole. */
export function investmentBreakdown(
  media: readonly { key: string; label: string; spend: number; platformFee: number }[],
  includeFee: boolean,
  costLines: readonly MarketingCostLine[],
): BreakdownSlice[] {
  const items: { key: string; label: string; value: number }[] = [
    ...media.map((m) => ({ key: m.key, label: m.label, value: m.spend })),
    ...(includeFee
      ? [
          {
            key: "platformFee",
            label: "Taxa das plataformas",
            value: media.reduce((s, m) => s + m.platformFee, 0),
          },
        ]
      : []),
    ...costLines.map((l) => ({ key: l.key, label: l.label, value: l.amount })),
  ].filter((i) => i.value > 0);
  const total = items.reduce((s, i) => s + i.value, 0);
  return items
    .sort((a, b) => b.value - a.value)
    .map((i) => ({ ...i, share: total > 0 ? (i.value / total) * 100 : 0 }));
}

export function funnelTable(
  current: FunnelCounts,
  lifetime: FunnelCounts,
): { steps: FunnelStepValue[]; ratios: FunnelRatioRow[] } {
  return {
    steps: funnelSteps.map((key) => ({ key, label: funnelStepLabel[key], value: current[key] })),
    ratios: funnelRatios.map((r) => {
      const value = funnelRatio(current, r);
      return {
        key: r.key,
        label: r.label,
        value,
        average: funnelRatio(lifetime, r),
        benchmark: r.benchmark,
        verdict: benchmarkVerdict(value, r.benchmark),
      };
    }),
  };
}

export type DiscountFacts = {
  orders: number;
  revenue: number;
  couponOrders: number;
  couponRevenue: number;
  discounts: number;
};

export function discountValues(f: DiscountFacts) {
  const plainOrders = f.orders - f.couponOrders;
  return {
    couponOrders: f.couponOrders,
    couponShare: percent(f.couponOrders, f.orders),
    discounts: f.discounts,
    couponRevenue: f.couponRevenue,
    discountRate: percent(f.discounts, f.couponRevenue + f.discounts),
    aovWithCoupon: ratio(f.couponRevenue, f.couponOrders),
    aovWithoutCoupon: ratio(f.revenue - f.couponRevenue, plainOrders),
  };
}

const discountDefinitions: {
  key: DiscountMetric["key"];
  label: string;
  unit: MetricValue["unit"];
  goodWhen: "up" | "down";
}[] = [
  { key: "couponOrders", label: "Pedidos com cupom", unit: "count", goodWhen: "up" },
  { key: "couponShare", label: "Participação nos pedidos", unit: "percent", goodWhen: "down" },
  { key: "discounts", label: "Desconto concedido", unit: "currency", goodWhen: "down" },
  { key: "couponRevenue", label: "Receita com cupom", unit: "currency", goodWhen: "up" },
  { key: "discountRate", label: "Desconto médio", unit: "percent", goodWhen: "down" },
  { key: "aovWithCoupon", label: "Ticket médio com cupom", unit: "currency", goodWhen: "up" },
  { key: "aovWithoutCoupon", label: "Ticket médio sem cupom", unit: "currency", goodWhen: "up" },
];

export function discountMetrics(
  current: DiscountFacts,
  previous: DiscountFacts | null,
): DiscountMetric[] {
  const cur = discountValues(current);
  const prev = previous ? discountValues(previous) : null;
  return discountDefinitions.map((d) => ({
    key: d.key,
    label: d.label,
    goodWhen: d.goodWhen,
    metric: metricValue(d.unit, cur[d.key], prev?.[d.key] ?? null),
  }));
}
