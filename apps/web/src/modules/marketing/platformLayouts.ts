import type { AdPlatform, PlatformKpi } from "@ecommerce/contracts/marketing";

export type PlatformTile = { key: PlatformKpi; label: string; goodWhen?: "up" | "down" };

export type PlatformLayout = {
  headline: PlatformTile[];
  path: PlatformTile[];
  contact: PlatformTile[] | null;
};

const spend: PlatformTile = { key: "spend", label: "Investido", goodWhen: "down" };
const ctr: PlatformTile = { key: "ctr", label: "CTR" };
const cpc: PlatformTile = { key: "cpc", label: "CPC", goodWhen: "down" };
const conversions: PlatformTile = { key: "conversions", label: "Conversões" };
const costPerConversion: PlatformTile = {
  key: "costPerConversion",
  label: "Custo por conversão",
  goodWhen: "down",
};
const costPerSession: PlatformTile = {
  key: "costPerSession",
  label: "Custo por sessão",
  goodWhen: "down",
};
const impressions: PlatformTile = { key: "impressions", label: "Impressões" };
const sessions: PlatformTile = { key: "sessions", label: "Sessões pagas" };

const metaLayout: PlatformLayout = {
  headline: [
    spend,
    { key: "reach", label: "Alcance" },
    { key: "cpm", label: "CPM", goodWhen: "down" },
    ctr,
    cpc,
    conversions,
    costPerConversion,
    costPerSession,
  ],
  path: [
    impressions,
    { key: "linkClicks", label: "Cliques no link" },
    { key: "landingPageViews", label: "Visualizações da página" },
    sessions,
    { key: "addToCart", label: "Adições ao carrinho" },
  ],
  contact: [
    { key: "leads", label: "Leads" },
    { key: "messages", label: "Conversas iniciadas" },
    { key: "costPerLead", label: "Custo por lead", goodWhen: "down" },
  ],
};

const googleLayout: PlatformLayout = {
  headline: [
    spend,
    impressions,
    { key: "impressionShare", label: "Parcela de impressões" },
    ctr,
    cpc,
    conversions,
    costPerConversion,
    costPerSession,
  ],
  path: [impressions, { key: "clicks", label: "Cliques" }, sessions, costPerSession],
  contact: null,
};

export const platformLayouts: Record<AdPlatform, PlatformLayout> = {
  META: metaLayout,
  GOOGLE: googleLayout,
  TIKTOK: metaLayout,
};
