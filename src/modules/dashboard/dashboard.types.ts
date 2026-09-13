import type { Fidelity } from "@/generated/prisma/enums";
import type {
  BreakdownSlice,
  MetricUnit,
  MetricValue,
  Series,
} from "@/shared/models/types/metric.types";

/** The metrics the Painel de Controle derives from the facts, in display order. */
export const dashboardMetricKeys = [
  "totalSold",
  "orders",
  "averageTicket",
  "conversionRate",
  "marketingInvestment",
  "roi",
  "cac",
  "cpa",
  "netProfit",
  "customers",
  "contributionMargin",
  "repurchaseRate",
] as const;

export type DashboardMetricKey = (typeof dashboardMetricKeys)[number];

export type DashboardMetricDefinition = {
  key: DashboardMetricKey;
  label: string;
  unit: MetricUnit;
  /** Whether an increase is good news (default) or bad (costs). */
  goodWhen: "up" | "down";
  /** Shown in the indicator carousel; the rest only feed the headline row and the matrix. */
  carousel: boolean;
};

export const dashboardMetricDefinitions: readonly DashboardMetricDefinition[] = [
  { key: "totalSold", label: "Total vendido", unit: "currency", goodWhen: "up", carousel: true },
  { key: "orders", label: "Pedidos", unit: "count", goodWhen: "up", carousel: true },
  { key: "averageTicket", label: "Ticket médio", unit: "currency", goodWhen: "up", carousel: true },
  {
    key: "conversionRate",
    label: "Taxa de conversão",
    unit: "percent",
    goodWhen: "up",
    carousel: true,
  },
  {
    key: "marketingInvestment",
    label: "Investimento em marketing",
    unit: "currency",
    goodWhen: "down",
    carousel: true,
  },
  { key: "roi", label: "ROI", unit: "multiplier", goodWhen: "up", carousel: true },
  { key: "cac", label: "CAC", unit: "currency", goodWhen: "down", carousel: true },
  { key: "cpa", label: "CPA", unit: "currency", goodWhen: "down", carousel: true },
  { key: "netProfit", label: "Lucro líquido", unit: "currency", goodWhen: "up", carousel: true },
  { key: "customers", label: "Clientes", unit: "count", goodWhen: "up", carousel: true },
  {
    key: "contributionMargin",
    label: "Margem de contribuição",
    unit: "percent",
    goodWhen: "up",
    carousel: false,
  },
  { key: "repurchaseRate", label: "Recompra", unit: "percent", goodWhen: "up", carousel: false },
];

export type DashboardMetric = DashboardMetricDefinition & {
  metric: MetricValue;
  fidelity: Fidelity;
  fidelityNote: string;
};

export type DashboardMatrixRow = {
  key: DashboardMetricKey;
  label: string;
  unit: MetricUnit;
  values: (number | null)[];
};

export type DashboardOverview = {
  metrics: DashboardMetric[];
  series: Record<DashboardMetricKey, Series>;
  bySource: BreakdownSlice[];
  matrix: { buckets: string[]; rows: DashboardMatrixRow[] };
};
