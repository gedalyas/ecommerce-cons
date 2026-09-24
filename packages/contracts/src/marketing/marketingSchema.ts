import { z } from "zod";

export const marketingTabs = [
  "geral",
  "meta",
  "google",
  "visao",
  "resumo",
  "campanhas",
  "descontos",
  "regioes",
  "social",
] as const;
export type MarketingTab = (typeof marketingTabs)[number];

export const investmentMetrics = ["totalSold", "adSpend", "roas", "roi", "cpa", "cac"] as const;
export type InvestmentMetric = (typeof investmentMetrics)[number];

export const sessionMetrics = [
  "totalSold",
  "conversionRate",
  "revenuePerSession",
  "costPerSession",
] as const;
export type SessionMetric = (typeof sessionMetrics)[number];

export const utmDimensions = ["canal", "origem", "origem-meio", "campanha"] as const;
export type UtmDimension = (typeof utmDimensions)[number];

export const adLevels = ["campanha", "conjunto", "anuncio"] as const;
export type AdLevel = (typeof adLevels)[number];

export const adPlatformFilters = ["todas", "META", "GOOGLE", "TIKTOK"] as const;
export type AdPlatformFilter = (typeof adPlatformFilters)[number];

export const adMetrics = [
  "spend",
  "orders",
  "cpa",
  "impressions",
  "cpm",
  "clicks",
  "cpc",
  "ctr",
] as const;
export type AdMetric = (typeof adMetrics)[number];

export const marketingSearchSchema = z.object({
  aba: z.enum(marketingTabs).catch("geral"),
  serie: z.enum(["mensal", "diaria"]).catch("mensal"),
  incluirTaxa: z.boolean().catch(true),
  metricaInvest: z.enum(investmentMetrics).catch("totalSold"),
  metricaSessoes: z.enum(sessionMetrics).catch("totalSold"),
  base: z.enum(["sessoes", "usuarios"]).catch("sessoes"),
  utm: z.enum(utmDimensions).catch("origem-meio"),
  nivel: z.enum(adLevels).catch("campanha"),
  plataforma: z.enum(adPlatformFilters).catch("todas"),
  metricaAds: z.enum(adMetrics).catch("spend"),
  mapa: z.enum(["roas", "revenue", "totalSpend", "cac"]).catch("roas"),
  conta: z.string().trim().max(64).catch("todas"),
  campanha: z.string().trim().max(128).nullable().catch(null),
  conjunto: z.string().trim().max(128).nullable().catch(null),
});

export type MarketingSearch = z.infer<typeof marketingSearchSchema>;
export const defaultMarketingSearch: MarketingSearch = marketingSearchSchema.parse({});
