import { channelsFromSales, type ChannelSales } from "@ecommerce/contracts/marketing";

export type Concentration = { share: number | null; channel: string | null };

export function revenueConcentration(rows: readonly ChannelSales[]): Concentration {
  const channels = channelsFromSales(rows);
  const total = channels.reduce((s, c) => s + c.revenue, 0);
  const top = [...channels].sort((a, b) => b.revenue - a.revenue)[0];
  if (!top || total <= 0) return { share: null, channel: null };
  return { share: (top.revenue / total) * 100, channel: top.label };
}
