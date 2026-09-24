import { prismaClient } from "@ecommerce/database/client";
import type { AdPlatform, FunnelStage } from "@ecommerce/database/enums";
import { recordActivity } from "@/modules/audit/contract";
import { marketplaceChannels } from "@/modules/orders/contract";
import {
  adPlatformLabel,
  funnelStageLabel,
  salesChannelOptions,
  siteChannel,
  type CampaignTagInput,
  type CampaignTagRow,
  type MarketingInvestmentFunnel,
  type SalesChannelOption,
} from "@ecommerce/contracts/marketing";
import type { Window } from "@ecommerce/contracts/shared/periodWindow";
import type { AuthContext } from "@/shared/http/auth.types";
import { HttpError, notFound } from "@/shared/http/httpError";
import { lastMonthsWindow } from "./generalMetrics";

type TagDbRow = {
  platform: AdPlatform;
  campaign_id: string;
  campaign_name: string;
  spend: number;
  stage: FunnelStage | null;
  channel: string | null;
};

async function campaignTags(clientId: string, w: Window): Promise<CampaignTagRow[]> {
  const rows = await prismaClient.$queryRaw<TagDbRow[]>`
    select a.platform, a.campaign_id,
      (array_agg(a.campaign_name order by a.date desc))[1] as campaign_name,
      coalesce(sum(a.spend), 0)::float8 as spend, t.stage, t.channel
    from ad_spend_daily a
    left join campaign_tag t
      on t.client_id = a.client_id and t.platform = a.platform and t.campaign_id = a.campaign_id
    where a.client_id = ${clientId} and a.date >= ${w.start} and a.date < ${w.end}
    group by a.platform, a.campaign_id, t.stage, t.channel
    order by spend desc, a.campaign_id
  `;
  return rows.map((r) => ({
    platform: r.platform,
    campaignId: r.campaign_id,
    campaignName: r.campaign_name,
    spend: r.spend,
    stage: r.stage,
    channel: r.channel ?? siteChannel,
  }));
}

export async function investmentFunnel(
  clientId: string,
  w: Window,
  channelsWindow: Window,
  canEdit: boolean,
): Promise<MarketingInvestmentFunnel> {
  const [tags, marketplaces] = await Promise.all([
    campaignTags(clientId, w),
    marketplaceChannels(clientId, channelsWindow),
  ]);
  return { tags, channels: salesChannelOptions(marketplaces), canEdit };
}

async function campaignName(clientId: string, input: CampaignTagInput): Promise<string> {
  const row = await prismaClient.adSpendDaily.findFirst({
    where: { clientId, platform: input.platform, campaignId: input.campaignId },
    orderBy: { date: "desc" },
    select: { campaignName: true },
  });
  if (!row) throw notFound("Campanha não encontrada nesta loja.");
  return row.campaignName;
}

async function channelOption(
  clientId: string,
  channel: string,
  channelsWindow: Window,
): Promise<SalesChannelOption> {
  const options = salesChannelOptions(await marketplaceChannels(clientId, channelsWindow));
  const option = options.find((o) => o.key === channel);
  if (!option) throw new HttpError(422, "Canal de venda desconhecido para esta loja.");
  return option;
}

export async function tagCampaign(
  auth: AuthContext,
  input: CampaignTagInput,
  today: string,
): Promise<void> {
  const { clientId } = auth;
  const channelsWindow = lastMonthsWindow(today, 13);
  const [name, channel] = await Promise.all([
    campaignName(clientId, input),
    channelOption(clientId, input.channel, channelsWindow),
  ]);
  await prismaClient.campaignTag.upsert({
    where: {
      clientId_platform_campaignId: {
        clientId,
        platform: input.platform,
        campaignId: input.campaignId,
      },
    },
    create: {
      clientId,
      platform: input.platform,
      campaignId: input.campaignId,
      stage: input.stage,
      channel: input.channel,
    },
    update: { stage: input.stage, channel: input.channel },
  });
  await recordActivity(auth, clientId, {
    action: "CAMPAIGN_TAGGED",
    campaign: name,
    platform: adPlatformLabel[input.platform],
    stage: input.stage ? funnelStageLabel[input.stage] : "Sem etapa",
    channel: channel.label,
  });
}
