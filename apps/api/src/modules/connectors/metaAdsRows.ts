import type { AdSpendRow } from "@/modules/imports/contract";

export type MetaInsight = {
  date_start?: string | null;
  campaign_id?: string | null;
  campaign_name?: string | null;
  adset_id?: string | null;
  adset_name?: string | null;
  ad_id?: string | null;
  ad_name?: string | null;
  spend?: string | number | null;
  impressions?: string | number | null;
  clicks?: string | number | null;
  actions?: { action_type?: string; value?: string | number }[] | null;
  action_values?: { action_type?: string; value?: string | number }[] | null;
};

export const META_INSIGHT_FIELDS = [
  "campaign_id",
  "campaign_name",
  "adset_id",
  "adset_name",
  "ad_id",
  "ad_name",
  "spend",
  "impressions",
  "clicks",
  "actions",
  "action_values",
].join(",");

const PURCHASE_ACTIONS = new Set([
  "purchase",
  "omni_purchase",
  "offsite_conversion.fb_pixel_purchase",
]);

const num = (value: string | number | null | undefined) => {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function purchaseTotal(
  entries: { action_type?: string; value?: string | number }[] | null | undefined,
): number {
  const purchase = (entries ?? []).find(
    (e) => e.action_type && PURCHASE_ACTIONS.has(e.action_type),
  );
  return purchase ? num(purchase.value) : 0;
}

export function adSpendRowOfMeta(insight: MetaInsight, index: number): AdSpendRow | null {
  if (!insight.date_start || !insight.campaign_id) return null;
  const campaignName = insight.campaign_name?.trim() || insight.campaign_id;
  const adsetName = insight.adset_name?.trim() || campaignName;
  const adName = insight.ad_name?.trim() || adsetName;
  return {
    row: index + 1,
    date: insight.date_start,
    platform: "META",
    campaignId: insight.campaign_id,
    campaignName,
    adsetId: insight.adset_id ?? insight.campaign_id,
    adsetName,
    adId: insight.ad_id ?? insight.adset_id ?? insight.campaign_id,
    adName,
    spend: Math.round(num(insight.spend) * 100) / 100,
    platformFee: 0,
    impressions: Math.round(num(insight.impressions)),
    clicks: Math.round(num(insight.clicks)),
    conversions: Math.round(purchaseTotal(insight.actions)),
    attributedRevenue: Math.round(purchaseTotal(insight.action_values) * 100) / 100,
  };
}

export function metaInsightId(insight: MetaInsight, index: number): string {
  return `${insight.date_start ?? ""}:${insight.ad_id ?? insight.adset_id ?? insight.campaign_id ?? index}`;
}
