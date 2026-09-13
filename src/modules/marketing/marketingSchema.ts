import { z } from "zod";

export const marketingTabs = ["visao", "resumo", "campanhas", "descontos", "regioes"] as const;
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

export const adPlatforms = ["todas", "META", "GOOGLE", "TIKTOK"] as const;
export type AdPlatformFilter = (typeof adPlatforms)[number];

export const adMetrics = [
  "spend",
  "revenue",
  "roas",
  "orders",
  "cpa",
  "impressions",
  "cpm",
  "clicks",
  "cpc",
  "ctr",
] as const;
export type AdMetric = (typeof adMetrics)[number];

/** The `/marketing` route's own search params; the global period comes from the root. */
export const marketingSearchSchema = z.object({
  aba: z.enum(marketingTabs).catch("visao"),
  incluirTaxa: z.boolean().catch(true),
  metricaInvest: z.enum(investmentMetrics).catch("totalSold"),
  metricaSessoes: z.enum(sessionMetrics).catch("totalSold"),
  base: z.enum(["sessoes", "usuarios"]).catch("sessoes"),
  utm: z.enum(utmDimensions).catch("origem-meio"),
  nivel: z.enum(adLevels).catch("campanha"),
  plataforma: z.enum(adPlatforms).catch("todas"),
  metricaAds: z.enum(adMetrics).catch("revenue"),
  mapa: z.enum(["roas", "revenue", "totalSpend", "cac"]).catch("roas"),
});

export type MarketingSearch = z.infer<typeof marketingSearchSchema>;
export const defaultMarketingSearch: MarketingSearch = marketingSearchSchema.parse({});
