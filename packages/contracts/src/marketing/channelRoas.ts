import { formatMultiplier } from "../shared/format";
import type { ChannelRoas, ChannelSales } from "./marketing.types";

export const siteChannel = "site";

export function channelsFromSales(rows: readonly ChannelSales[]): ChannelRoas[] {
  const site = rows.filter((r) => !r.marketplace).reduce((sum, r) => sum + r.revenue, 0);
  const marketplaces = new Map<string, number>();
  for (const r of rows) {
    if (r.marketplace) marketplaces.set(r.channel, (marketplaces.get(r.channel) ?? 0) + r.revenue);
  }
  return [
    { key: siteChannel, label: "Site", revenue: site, investment: 0, roas: null },
    ...[...marketplaces].map(([channel, revenue]) => ({
      key: channel,
      label: channel,
      revenue,
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
