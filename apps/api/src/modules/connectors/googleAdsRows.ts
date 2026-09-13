import type { AdSpendRow } from "@/modules/imports/contract";

export type GoogleAdsResultRow = {
  segments?: { date?: string | null } | null;
  campaign?: { id?: string | number | null; name?: string | null } | null;
  adGroup?: { id?: string | number | null; name?: string | null } | null;
  adGroupAd?: { ad?: { id?: string | number | null; name?: string | null } | null } | null;
  metrics?: {
    costMicros?: string | number | null;
    impressions?: string | number | null;
    clicks?: string | number | null;
    conversions?: string | number | null;
    conversionsValue?: string | number | null;
  } | null;
};

const MICROS = 1_000_000;

const num = (value: string | number | null | undefined) => {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function adSpendRowOfGoogle(row: GoogleAdsResultRow, index: number): AdSpendRow | null {
  const date = row.segments?.date;
  const campaignId = row.campaign?.id;
  if (!date || campaignId === null || campaignId === undefined) return null;
  const campaignName = row.campaign?.name?.trim() || String(campaignId);
  const adsetName = row.adGroup?.name?.trim() || campaignName;
  const adName = row.adGroupAd?.ad?.name?.trim() || adsetName;
  return {
    row: index + 1,
    date,
    platform: "GOOGLE",
    campaignId: String(campaignId),
    campaignName,
    adsetId: String(row.adGroup?.id ?? campaignId),
    adsetName,
    adId: String(row.adGroupAd?.ad?.id ?? row.adGroup?.id ?? campaignId),
    adName,
    spend: Math.round((num(row.metrics?.costMicros) / MICROS) * 100) / 100,
    platformFee: 0,
    impressions: Math.round(num(row.metrics?.impressions)),
    clicks: Math.round(num(row.metrics?.clicks)),
    conversions: Math.round(num(row.metrics?.conversions)),
    attributedRevenue: Math.round(num(row.metrics?.conversionsValue) * 100) / 100,
  };
}

export function adsQuery(from: string, to: string): string {
  return [
    "SELECT segments.date, campaign.id, campaign.name, ad_group.id, ad_group.name,",
    "ad_group_ad.ad.id, ad_group_ad.ad.name, metrics.cost_micros, metrics.impressions,",
    "metrics.clicks, metrics.conversions, metrics.conversions_value",
    `FROM ad_group_ad WHERE segments.date BETWEEN '${from}' AND '${to}'`,
  ].join(" ");
}

export function customerIdOf(resourceName: string): string {
  return resourceName.replace(/^customers\//, "").replace(/-/g, "");
}
