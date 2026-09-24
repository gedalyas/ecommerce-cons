import {
  channelRoas,
  channelsFromSales,
  siteChannel,
  type ChannelRoas,
  type ChannelSales,
  type MarketingSalesChannels,
  type SalesChannelRow,
} from "@ecommerce/contracts/marketing";
import type { Channel } from "@ecommerce/contracts/shared/period";
import { variationOf } from "@ecommerce/contracts/shared/metricValue";
import { ratio } from "./marketingMetrics";

export type ChannelFacts = {
  sales: readonly ChannelSales[];
  siteSessions: number;
  investment: Readonly<Record<string, number>>;
};

export function investmentForFilter(
  channel: Channel,
  investment: Readonly<Record<string, number>>,
): Record<string, number> {
  return Object.fromEntries(
    Object.entries(investment).filter(([key]) =>
      channel === "todos" ? true : (key === siteChannel) === (channel === "ecommerce"),
    ),
  );
}

function channelsOf(facts: ChannelFacts): ChannelRoas[] {
  return channelRoas(channelsFromSales(facts.sales), facts.investment);
}

function rowOf(
  c: ChannelRoas,
  p: ChannelRoas | undefined,
  sessions: { current: number | null; previous: number | null },
  totalRevenue: number,
): SalesChannelRow {
  const aov = ratio(c.revenue, c.orders);
  const conversionRate = sessions.current == null ? null : ratio(c.orders * 100, sessions.current);
  const previousConversion =
    p && sessions.previous != null ? ratio(p.orders * 100, sessions.previous) : null;
  return {
    key: c.key,
    label: c.label,
    revenue: c.revenue,
    revenueVariation: variationOf(c.revenue, p?.revenue ?? null),
    share: ratio(c.revenue * 100, totalRevenue),
    orders: c.orders,
    aov,
    aovVariation: variationOf(aov, p ? ratio(p.revenue, p.orders) : null),
    sessions: sessions.current,
    conversionRate,
    conversionVariation: variationOf(conversionRate, previousConversion),
    investment: c.investment,
    roas: c.roas,
  };
}

const sumOf = (channels: readonly ChannelRoas[], label: string): ChannelRoas => {
  const revenue = channels.reduce((s, c) => s + c.revenue, 0);
  const investment = channels.reduce((s, c) => s + c.investment, 0);
  return {
    key: "total",
    label,
    revenue,
    orders: channels.reduce((s, c) => s + c.orders, 0),
    investment,
    roas: ratio(revenue, investment),
  };
};

export function salesChannelRows(
  current: ChannelFacts,
  previous: ChannelFacts | null,
): MarketingSalesChannels {
  const cur = channelsOf(current);
  const prev = previous ? channelsOf(previous) : [];
  const prevByKey = new Map(prev.map((c) => [c.key, c]));
  const totalRevenue = cur.reduce((s, c) => s + c.revenue, 0);
  const sessionsOf = (key: string) =>
    key === siteChannel
      ? { current: current.siteSessions, previous: previous?.siteSessions ?? null }
      : { current: null, previous: null };
  return {
    rows: cur.map((c) => rowOf(c, prevByKey.get(c.key), sessionsOf(c.key), totalRevenue)),
    total: rowOf(
      sumOf(cur, "Total"),
      previous ? sumOf(prev, "Total") : undefined,
      { current: null, previous: null },
      totalRevenue,
    ),
  };
}
