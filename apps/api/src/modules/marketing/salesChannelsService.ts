import { salesByChannel } from "@/modules/orders/contract";
import type { MarketingSalesChannels } from "@ecommerce/contracts/marketing";
import type { Channel, PeriodSearch } from "@ecommerce/contracts/shared/period";
import { resolvePeriod, type Window } from "@ecommerce/contracts/shared/periodWindow";
import { investedOf } from "./generalMetrics";
import { adSpendAggregate, trafficAggregate } from "./marketingService";
import { salesChannelRows, type ChannelFacts } from "./salesChannelRows";

type ChannelsInput = PeriodSearch & { incluirTaxa: boolean };

const keepsChannel = (channel: Channel, marketplace: boolean) =>
  channel === "todos" || (channel === "marketplace") === marketplace;

async function channelFacts(
  clientId: string,
  w: Window,
  input: ChannelsInput,
): Promise<ChannelFacts> {
  const [sales, traffic, ads] = await Promise.all([
    salesByChannel(clientId, w),
    trafficAggregate(clientId, w),
    adSpendAggregate(clientId, w),
  ]);
  return {
    sales: sales.filter((s) => keepsChannel(input.canal, s.marketplace)),
    siteSessions: traffic.sessions,
    siteInvestment: input.canal === "marketplace" ? 0 : investedOf(ads, input.incluirTaxa),
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
