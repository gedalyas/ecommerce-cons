import type { AdSpendRow } from "@/modules/imports/contract";

export type TiktokReportRow = {
  dimensions?: { ad_id?: string | number | null; stat_time_day?: string | null } | null;
  metrics?: {
    campaign_id?: string | number | null;
    campaign_name?: string | null;
    adgroup_id?: string | number | null;
    adgroup_name?: string | null;
    ad_name?: string | null;
    spend?: string | number | null;
    impressions?: string | number | null;
    clicks?: string | number | null;
    conversion?: string | number | null;
    total_purchase_value?: string | number | null;
  } | null;
};

export const TIKTOK_METRICS = [
  "campaign_id",
  "campaign_name",
  "adgroup_id",
  "adgroup_name",
  "ad_name",
  "spend",
  "impressions",
  "clicks",
  "conversion",
  "total_purchase_value",
];

const num = (value: string | number | null | undefined) => {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function adSpendRowOfTiktok(row: TiktokReportRow, index: number): AdSpendRow | null {
  const day = row.dimensions?.stat_time_day?.slice(0, 10);
  const campaignId = row.metrics?.campaign_id;
  if (!day || campaignId === null || campaignId === undefined) return null;
  const campaignName = row.metrics?.campaign_name?.trim() || String(campaignId);
  const adsetName = row.metrics?.adgroup_name?.trim() || campaignName;
  return {
    row: index + 1,
    date: day,
    platform: "TIKTOK",
    campaignId: String(campaignId),
    campaignName,
    adsetId: String(row.metrics?.adgroup_id ?? campaignId),
    adsetName,
    adId: String(row.dimensions?.ad_id ?? row.metrics?.adgroup_id ?? campaignId),
    adName: row.metrics?.ad_name?.trim() || adsetName,
    spend: Math.round(num(row.metrics?.spend) * 100) / 100,
    platformFee: 0,
    impressions: Math.round(num(row.metrics?.impressions)),
    clicks: Math.round(num(row.metrics?.clicks)),
    conversions: Math.round(num(row.metrics?.conversion)),
    attributedRevenue: Math.round(num(row.metrics?.total_purchase_value) * 100) / 100,
  };
}
