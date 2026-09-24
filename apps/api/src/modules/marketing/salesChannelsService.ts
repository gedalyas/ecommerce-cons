import { salesByChannel } from "@/modules/orders/contract";
import type { MarketingSalesChannels } from "@ecommerce/contracts/marketing";
import type { Channel, PeriodSearch } from "@ecommerce/contracts/shared/period";
import { resolvePeriod, type Window } from "@ecommerce/contracts/shared/periodWindow";
import { channelInvestment } from "./investmentFunnelService";
import { trafficAggregate } from "./marketingService";
import { investmentForFilter, salesChannelRows, type ChannelFacts } from "./salesChannelRows";

type ChannelsInput = PeriodSearch & { incluirTaxa: boolean };

const keepsChannel = (channel: Channel, marketplace: boolean) =>
  channel === "todos" || (channel === "marketplace") === marketplace;

async function channelFacts(
  clientId: string,
  w: Window,
  input: ChannelsInput,
): Promise<ChannelFacts> {
  const [sales, traffic, investment] = await Promise.all([
    salesByChannel(clientId, w),
    trafficAggregate(clientId, w),
    channelInvestment(clientId, w, input.incluirTaxa),
  ]);
  return {
    sales: sales.filter((s) => keepsChannel(input.canal, s.marketplace)),
    siteSessions: traffic.sessions,
    investment: investmentForFilter(input.canal, investment),
  };
}

export async function salesChannels(
  clientId: string,
  input: ChannelsInput,
): Promise<MarketingSalesChannels> {
  const period = resolvePeriod(input);
  const [current, previous] = await Promise.all([
    channelFacts(clientId, period.current, input),
    period.previous ? channelFacts(clientId, period.previous, input) : null,
  ]);
  return salesChannelRows(current, previous);
}
