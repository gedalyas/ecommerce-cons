import type { AdSpendRow, KeywordRow } from "@/modules/imports/contract";

type Id = string | number | null | undefined;
type Num = string | number | null | undefined;

export type GoogleAdsResultRow = {
  segments?: { date?: string | null } | null;
  customer?: { descriptiveName?: string | null } | null;
  campaign?: { id?: Id; name?: string | null; advertisingChannelType?: string | null } | null;
  adGroup?: { id?: Id; name?: string | null } | null;
  adGroupAd?: { ad?: { id?: Id; name?: string | null } | null } | null;
  adGroupCriterion?: {
    keyword?: { text?: string | null; matchType?: string | null } | null;
  } | null;
  metrics?: {
    costMicros?: Num;
    impressions?: Num;
    clicks?: Num;
    conversions?: Num;
    conversionsValue?: Num;
    searchImpressionShare?: Num;
  } | null;
};

const MICROS = 1_000_000;

const num = (value: Num) => {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const money = (micros: Num) => Math.round((num(micros) / MICROS) * 100) / 100;

const dateRange = (from: string, to: string) => `WHERE segments.date BETWEEN '${from}' AND '${to}'`;

const METRICS = [
  "metrics.cost_micros",
  "metrics.impressions",
  "metrics.clicks",
  "metrics.conversions",
  "metrics.conversions_value",
];

export const adsQuery = (from: string, to: string): string =>
  [
    "SELECT segments.date, customer.descriptive_name, campaign.id, campaign.name,",
    "campaign.advertising_channel_type, ad_group.id, ad_group.name, ad_group_ad.ad.id,",
    `ad_group_ad.ad.name, ${METRICS.join(", ")}`,
    `FROM ad_group_ad ${dateRange(from, to)}`,
  ].join(" ");

export const campaignsQuery = (from: string, to: string): string =>
  [
    "SELECT segments.date, customer.descriptive_name, campaign.id, campaign.name,",
    `campaign.advertising_channel_type, ${METRICS.join(", ")}, metrics.search_impression_share`,
    `FROM campaign ${dateRange(from, to)}`,
  ].join(" ");

export const keywordsQuery = (from: string, to: string): string =>
  [
    "SELECT segments.date, campaign.id, campaign.name, ad_group.id, ad_group.name,",
    "ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type,",
    "metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions",
    `FROM keyword_view ${dateRange(from, to)}`,
  ].join(" ");

function baseRow(row: GoogleAdsResultRow, index: number, accountId: string) {
  const date = row.segments?.date;
  const campaignId = row.campaign?.id;
  if (!date || campaignId === null || campaignId === undefined) return null;
  const campaignName = row.campaign?.name?.trim() || String(campaignId);
  return {
    row: index + 1,
    date,
    platform: "GOOGLE" as const,
    accountId,
    accountName: row.customer?.descriptiveName?.trim() || accountId,
    campaignId: String(campaignId),
    campaignName,
    campaignType: row.campaign?.advertisingChannelType ?? null,
    spend: money(row.metrics?.costMicros),
    platformFee: 0,
    impressions: Math.round(num(row.metrics?.impressions)),
    clicks: Math.round(num(row.metrics?.clicks)),
    conversions: Math.round(num(row.metrics?.conversions)),
    attributedRevenue: Math.round(num(row.metrics?.conversionsValue) * 100) / 100,
  };
}

export function adSpendRowOfGoogle(
  row: GoogleAdsResultRow,
  index: number,
  accountId: string,
): AdSpendRow | null {
  const base = baseRow(row, index, accountId);
  if (!base) return null;
  const adsetName = row.adGroup?.name?.trim() || base.campaignName;
  return {
    ...base,
    adsetId: String(row.adGroup?.id ?? base.campaignId),
    adsetName,
    adId: String(row.adGroupAd?.ad?.id ?? row.adGroup?.id ?? base.campaignId),
    adName: row.adGroupAd?.ad?.name?.trim() || adsetName,
  };
}

const campaignDay = (r: { date: string; campaignId: string }) => `${r.date}|${r.campaignId}`;

export function googleAdSpendRows(
  ads: readonly GoogleAdsResultRow[],
  campaigns: readonly GoogleAdsResultRow[],
  accountId: string,
): AdSpendRow[] {
  const adRows = ads.flatMap((r, i) => adSpendRowOfGoogle(r, i, accountId) ?? []);
  const withAds = new Set(adRows.map(campaignDay));
  const share = new Map<string, number>();
  const campaignOnly: AdSpendRow[] = [];
  campaigns.forEach((r, i) => {
    const base = baseRow(r, adRows.length + i, accountId);
    if (!base) return;
    share.set(campaignDay(base), num(r.metrics?.searchImpressionShare));
    if (withAds.has(campaignDay(base))) return;
    campaignOnly.push({
      ...base,
      adsetId: base.campaignId,
      adsetName: base.campaignName,
      adId: base.campaignId,
      adName: base.campaignName,
    });
  });
  return [...adRows, ...campaignOnly].map((row) => {
    const fraction = share.get(campaignDay(row)) ?? 0;
    return fraction > 0
      ? { ...row, eligibleImpressions: Math.round(row.impressions / fraction) }
      : row;
  });
}

export function keywordRowOfGoogle(row: GoogleAdsResultRow, accountId: string): KeywordRow | null {
  const date = row.segments?.date;
  const keyword = row.adGroupCriterion?.keyword?.text?.trim();
  const campaignId = row.campaign?.id;
  const adGroupId = row.adGroup?.id;
  if (!date || !keyword || campaignId == null || adGroupId == null) return null;
  return {
    date,
    platform: "GOOGLE",
    accountId,
    campaignId: String(campaignId),
    campaignName: row.campaign?.name?.trim() || String(campaignId),
    adGroupId: String(adGroupId),
    adGroupName: row.adGroup?.name?.trim() || String(adGroupId),
    keyword,
    matchType: row.adGroupCriterion?.keyword?.matchType ?? "",
    spend: money(row.metrics?.costMicros),
    impressions: Math.round(num(row.metrics?.impressions)),
    clicks: Math.round(num(row.metrics?.clicks)),
    conversions: Math.round(num(row.metrics?.conversions)),
  };
}

export function customerIdOf(resourceName: string): string {
  return resourceName.replace(/^customers\//, "").replace(/-/g, "");
}
