import type { AdPlatform } from "./marketing.types";
import { adLevelLabel } from "./marketingLabels";
import type { AdLevel } from "./marketingSchema";

const campaignTypes = [
  "SEARCH",
  "PERFORMANCE_MAX",
  "SHOPPING",
  "DISPLAY",
  "VIDEO",
  "DEMAND_GEN",
  "CONVERSIONS",
  "CATALOG",
  "TRAFFIC",
  "ENGAGEMENT",
  "LEADS",
  "MESSAGES",
  "REACH",
  "AWARENESS",
] as const;
type CampaignType = (typeof campaignTypes)[number];

const campaignTypeLabel: Record<CampaignType, string> = {
  SEARCH: "Pesquisa",
  PERFORMANCE_MAX: "Performance Max",
  SHOPPING: "Shopping",
  DISPLAY: "Display",
  VIDEO: "Vídeo",
  DEMAND_GEN: "Geração de demanda",
  CONVERSIONS: "Vendas",
  CATALOG: "Catálogo",
  TRAFFIC: "Tráfego",
  ENGAGEMENT: "Engajamento",
  LEADS: "Cadastros",
  MESSAGES: "Mensagens",
  REACH: "Alcance",
  AWARENESS: "Reconhecimento",
};

const keywordMatchTypes = ["EXACT", "PHRASE", "BROAD"] as const;
type KeywordMatchType = (typeof keywordMatchTypes)[number];

const keywordMatchTypeLabel: Record<KeywordMatchType, string> = {
  EXACT: "Exata",
  PHRASE: "Frase",
  BROAD: "Ampla",
};

const isOneOf = <T extends string>(set: readonly T[], value: string): value is T =>
  (set as readonly string[]).includes(value);

export const campaignTypeLabelOf = (type: string | null): string =>
  type == null || type === "" ? "—" : isOneOf(campaignTypes, type) ? campaignTypeLabel[type] : type;

export const matchTypeLabelOf = (type: string): string =>
  type === "" ? "—" : isOneOf(keywordMatchTypes, type) ? keywordMatchTypeLabel[type] : type;

export const platformLevelLabel = (platform: AdPlatform, level: AdLevel): string =>
  platform === "GOOGLE" && level === "conjunto" ? "Grupos de anúncios" : adLevelLabel[level];

export const adsetNounOf = (platform: AdPlatform): string =>
  platform === "GOOGLE" ? "Grupo" : "Conjunto";
