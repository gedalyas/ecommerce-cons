import type { MetricUnit, MetricValue } from "../shared/metric.types";

export const reportSectionKeys = [
  "kpis",
  "salesVsInvestment",
  "roasByChannel",
  "channelSplit",
  "topProducts",
  "funnel",
  "meta",
  "google",
  "investmentFunnel",
  "salesChannels",
] as const;
export type ReportSectionKey = (typeof reportSectionKeys)[number];

export const reportSectionLabel: Record<ReportSectionKey, string> = {
  kpis: "Indicadores do período",
  salesVsInvestment: "Vendido × Investido",
  roasByChannel: "ROAS por canal",
  channelSplit: "Canais de venda",
  topProducts: "Produtos mais vendidos",
  funnel: "Funil de vendas",
  meta: "Meta Ads",
  google: "Google Ads",
  investmentFunnel: "Funil de investimento",
  salesChannels: "Vendas por canal",
};

export const reportTemplates = ["weekly", "monthly"] as const;
export type ReportTemplate = (typeof reportTemplates)[number];

export const reportTemplateLabel: Record<ReportTemplate, string> = {
  weekly: "Reunião semanal",
  monthly: "Fechamento do mês",
};

export type ReportCell = string | number | null;

export type ReportColumn = { key: string; label: string; unit: MetricUnit | "text" };

export type ReportKpi = { label: string; metric: MetricValue; goodWhen: "up" | "down" };

export type ReportChartSeries = { key: string; label: string; values: number[] };

export type ReportBlock =
  | { kind: "kpis"; items: ReportKpi[] }
  | {
      kind: "chart";
      chart: "bars" | "lines";
      unit: MetricUnit;
      buckets: string[];
      series: ReportChartSeries[];
    }
  | { kind: "table"; columns: ReportColumn[]; rows: Record<string, ReportCell>[] }
  | { kind: "note"; text: string };

export type ReportSection = { key: ReportSectionKey; title: string; blocks: ReportBlock[] };

export type ReportDocument = {
  title: string;
  storeName: string;
  range: { inicio: string; fim: string };
  generatedAt: string;
  timezone: string;
  sections: ReportSection[];
};
