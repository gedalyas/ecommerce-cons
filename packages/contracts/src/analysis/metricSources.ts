import type { AnalysisMetricKey } from "./analysis.types";

export type MetricSourceKind = "traffic" | "ad_spend";

const sourceOfMetric: Partial<Record<AnalysisMetricKey, MetricSourceKind>> = {
  sessions: "traffic",
  conversionRate: "traffic",
  costPerSession: "traffic",
  roas: "ad_spend",
  roi: "ad_spend",
  cpa: "ad_spend",
  cac: "ad_spend",
  cpc: "ad_spend",
};

const missingSourceNotice: Record<MetricSourceKind, string> = {
  traffic:
    "Esta loja não tem fonte de tráfego (GA4 ou planilha): sessões e conversão aparecem zeradas. Conecte o GA4 em Integrações.",
  ad_spend:
    "Esta loja não tem fonte de anúncios (Meta, Google, TikTok ou planilha): ROAS, CPA e CAC não incluem a mídia paga. Conecte as contas de anúncio em Integrações.",
};

export function metricSourceNotice(
  metric: AnalysisMetricKey,
  available: Record<MetricSourceKind, boolean>,
): string | null {
  const kind = sourceOfMetric[metric];
  return kind && !available[kind] ? missingSourceNotice[kind] : null;
}
