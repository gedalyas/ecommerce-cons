import type { MetricUnit } from "../shared/metric.types";
import type {
  AdLevel,
  AdMetric,
  InvestmentMetric,
  SessionMetric,
  UtmDimension,
} from "./marketingSchema";

export const investmentMetricLabel: Record<InvestmentMetric, { label: string; unit: MetricUnit }> =
  {
    totalSold: { label: "Total vendido", unit: "currency" },
    adSpend: { label: "Investimento", unit: "currency" },
    roas: { label: "ROAS", unit: "multiplier" },
    roi: { label: "ROI", unit: "percent" },
    cpa: { label: "CPA", unit: "currency" },
    cac: { label: "CAC", unit: "currency" },
  };

export const sessionMetricLabel: Record<SessionMetric, { label: string; unit: MetricUnit }> = {
  totalSold: { label: "Total vendido", unit: "currency" },
  conversionRate: { label: "Taxa de conversão", unit: "percent" },
  revenuePerSession: { label: "Receita por sessão", unit: "currency" },
  costPerSession: { label: "Custo por sessão", unit: "currency" },
};

export const utmDimensionLabel: Record<UtmDimension, string> = {
  canal: "Canal",
  origem: "Origem",
  "origem-meio": "Origem / meio",
  campanha: "Campanha",
};

export const adLevelLabel: Record<AdLevel, string> = {
  campanha: "Campanhas",
  conjunto: "Conjuntos de anúncios",
  anuncio: "Anúncios",
};

export const adMetricLabel: Record<AdMetric, { label: string; unit: MetricUnit }> = {
  spend: { label: "Investimento", unit: "currency" },
  revenue: { label: "Receita atribuída", unit: "currency" },
  roas: { label: "ROAS", unit: "multiplier" },
  orders: { label: "Conversões", unit: "count" },
  cpa: { label: "CPA", unit: "currency" },
  impressions: { label: "Impressões", unit: "count" },
  cpm: { label: "CPM", unit: "currency" },
  clicks: { label: "Cliques", unit: "count" },
  cpc: { label: "CPC", unit: "currency" },
  ctr: { label: "CTR", unit: "percent" },
};
