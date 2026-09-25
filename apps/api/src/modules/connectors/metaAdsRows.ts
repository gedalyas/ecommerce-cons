import type { ConnectorAccountOption } from "@ecommerce/contracts/connectors";
import type { AdSpendRow } from "@/modules/imports/contract";

type ActionEntry = { action_type?: string; value?: string | number };

export type MetaInsight = {
  date_start?: string | null;
  account_name?: string | null;
  campaign_id?: string | null;
  campaign_name?: string | null;
  objective?: string | null;
  adset_id?: string | null;
  adset_name?: string | null;
  ad_id?: string | null;
  ad_name?: string | null;
  spend?: string | number | null;
  impressions?: string | number | null;
  reach?: string | number | null;
  clicks?: string | number | null;
  actions?: ActionEntry[] | null;
  action_values?: ActionEntry[] | null;
};

export type MetaRowContext = { accountId: string; thumbnails: ReadonlyMap<string, string> };

export const META_INSIGHT_FIELDS = [
  "account_name",
  "campaign_id",
  "campaign_name",
  "objective",
  "adset_id",
  "adset_name",
  "ad_id",
  "ad_name",
  "spend",
  "impressions",
  "reach",
  "clicks",
  "actions",
  "action_values",
].join(",");

export const ALL_META_ACCOUNTS = "all";
export const MAX_META_ACCOUNTS = 10;

const PURCHASE = ["purchase", "omni_purchase", "offsite_conversion.fb_pixel_purchase"];
const LINK_CLICK = ["link_click"];
const LANDING_PAGE_VIEW = ["landing_page_view", "omni_landing_page_view"];
const ADD_TO_CART = ["add_to_cart", "omni_add_to_cart", "offsite_conversion.fb_pixel_add_to_cart"];
const LEAD = ["lead", "onsite_conversion.lead_grouped", "offsite_conversion.fb_pixel_lead"];
const MESSAGE = ["onsite_conversion.messaging_conversation_started_7d"];

const OBJECTIVE_TYPE: Record<string, string> = {
  OUTCOME_SALES: "CONVERSIONS",
  CONVERSIONS: "CONVERSIONS",
  PRODUCT_CATALOG_SALES: "CATALOG",
  OUTCOME_LEADS: "LEADS",
  LEAD_GENERATION: "LEADS",
  OUTCOME_TRAFFIC: "TRAFFIC",
  LINK_CLICKS: "TRAFFIC",
  OUTCOME_ENGAGEMENT: "ENGAGEMENT",
  POST_ENGAGEMENT: "ENGAGEMENT",
  MESSAGES: "MESSAGES",
  OUTCOME_AWARENESS: "AWARENESS",
  BRAND_AWARENESS: "AWARENESS",
  REACH: "REACH",
};

const num = (value: string | number | null | undefined) => {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function actionTotal(
  entries: ActionEntry[] | null | undefined,
  types: readonly string[],
): number {
  const found = (entries ?? []).find((e) => e.action_type && types.includes(e.action_type));
  return found ? num(found.value) : 0;
}

export const purchaseTotal = (entries: ActionEntry[] | null | undefined) =>
  actionTotal(entries, PURCHASE);

export const campaignTypeOfObjective = (objective: string | null | undefined): string | null =>
  objective ? (OBJECTIVE_TYPE[objective] ?? objective) : null;

const count = (value: number) => Math.round(value);

export function adSpendRowOfMeta(
  insight: MetaInsight,
  index: number,
  context: MetaRowContext,
): AdSpendRow | null {
  if (!insight.date_start || !insight.campaign_id) return null;
  const campaignName = insight.campaign_name?.trim() || insight.campaign_id;
  const adsetName = insight.adset_name?.trim() || campaignName;
  const adName = insight.ad_name?.trim() || adsetName;
  const adId = insight.ad_id ?? insight.adset_id ?? insight.campaign_id;
  const actions = insight.actions;
  return {
    row: index + 1,
    date: insight.date_start,
    platform: "META",
    accountId: context.accountId,
    accountName: insight.account_name?.trim() || context.accountId,
    campaignId: insight.campaign_id,
    campaignName,
    campaignType: campaignTypeOfObjective(insight.objective),
    adsetId: insight.adset_id ?? insight.campaign_id,
    adsetName,
    adId,
    adName,
    spend: Math.round(num(insight.spend) * 100) / 100,
    platformFee: 0,
    impressions: count(num(insight.impressions)),
    reach: count(num(insight.reach)),
    clicks: count(num(insight.clicks)),
    linkClicks: count(actionTotal(actions, LINK_CLICK)),
    landingPageViews: count(actionTotal(actions, LANDING_PAGE_VIEW)),
    addToCart: count(actionTotal(actions, ADD_TO_CART)),
    conversions: count(purchaseTotal(actions)),
    leads: count(actionTotal(actions, LEAD)),
    messages: count(actionTotal(actions, MESSAGE)),
    attributedRevenue: Math.round(purchaseTotal(insight.action_values) * 100) / 100,
    thumbnailUrl: context.thumbnails.get(adId) ?? null,
  };
}

export function metaInsightId(insight: MetaInsight, index: number): string {
  return `${insight.date_start ?? ""}:${insight.ad_id ?? insight.adset_id ?? insight.campaign_id ?? index}`;
}

export function accountsToSync(selected: string | null, available: readonly string[]): string[] {
  if (selected === ALL_META_ACCOUNTS) return available.slice(0, MAX_META_ACCOUNTS);
  return selected && available.includes(selected) ? [selected] : [];
}

export const accountOptions = (
  accounts: readonly ConnectorAccountOption[],
): ConnectorAccountOption[] =>
  accounts.length > 1 && accounts.length <= MAX_META_ACCOUNTS
    ? [{ id: ALL_META_ACCOUNTS, label: "Todas as contas" }, ...accounts]
    : [...accounts];
