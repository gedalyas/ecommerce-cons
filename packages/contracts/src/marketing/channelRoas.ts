import { formatMultiplier } from "../shared/format";
import type { ChannelRoas, ChannelSales, SalesChannelOption } from "./marketing.types";

export const siteChannel = "site";
const siteLabel = "Site";

export const salesChannelOptions = (marketplaces: readonly string[]): SalesChannelOption[] => [
  { key: siteChannel, label: siteLabel },
  ...[...new Set(marketplaces)].sort().map((channel) => ({ key: channel, label: channel })),
];

export function channelsFromSales(rows: readonly ChannelSales[]): ChannelRoas[] {
  const own = rows.filter((r) => !r.marketplace);
  const site = {
    revenue: own.reduce((sum, r) => sum + r.revenue, 0),
    orders: own.reduce((sum, r) => sum + r.orders, 0),
  };
  const marketplaces = new Map<string, { revenue: number; orders: number }>();
  for (const r of rows) {
    if (!r.marketplace) continue;
    const acc = marketplaces.get(r.channel) ?? { revenue: 0, orders: 0 };
    marketplaces.set(r.channel, {
      revenue: acc.revenue + r.revenue,
      orders: acc.orders + r.orders,
    });
  }
  return [
    { key: siteChannel, label: siteLabel, ...site, investment: 0, roas: null },
    ...[...marketplaces].map(([channel, sums]) => ({
      key: channel,
      label: channel,
      ...sums,
      investment: 0,
      roas: null,
    })),
  ];
}

export function channelRoas(
  channels: readonly ChannelRoas[],
  investmentByChannel: Readonly<Record<string, number>>,
): ChannelRoas[] {
  return channels
    .map((c) => {
      const investment = investmentByChannel[c.key] ?? 0;
      return { ...c, investment, roas: investment > 0 ? c.revenue / investment : null };
    })
    .filter((c) => c.revenue > 0 || c.investment > 0)
    .sort((a, b) => b.investment - a.investment || b.revenue - a.revenue);
}

export const channelRoasSummary = (rows: readonly ChannelRoas[]): string =>
  rows
    .map((r) => `${r.label} ${r.roas == null ? "sem investimento" : formatMultiplier(r.roas)}`)
    .join(" · ");
