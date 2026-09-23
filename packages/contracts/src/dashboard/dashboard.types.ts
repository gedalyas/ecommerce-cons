import type { AlertItem } from "../alerts/contract";
import type { ConsultingRecommendation, MilestoneCriterion } from "../consulting/contract";
import type { Fidelity } from "../shared/fidelity";
import type { BreakdownSlice, MetricUnit, MetricValue, Series } from "../shared/metric.types";
import type { DashboardLayout } from "./dashboardWidgets";

export const dashboardMetricKeys = [
  "totalSold",
  "orders",
  "averageTicket",
  "conversionRate",
  "marketingInvestment",
  "roi",
  "roas",
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
  goodWhen: "up" | "down";
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
  { key: "roas", label: "ROAS", unit: "multiplier", goodWhen: "up", carousel: true },
  { key: "cac", label: "CAC", unit: "percent", goodWhen: "down", carousel: true },
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

export type DashboardMilestone = {
  criteria: MilestoneCriterion[];
  achieved: number;
  total: number;
};

export type DashboardChannelPoint = { bucket: string; ecommerce: number; marketplace: number };

export type DashboardTopProduct = {
  productId: string;
  name: string;
  revenue: number;
  units: number;
};

export type DashboardCustomerMix = { newCustomers: number; returningCustomers: number };

export type DashboardFunnelStep = { key: string; label: string; value: number };

export type DashboardPaidMediaPoint = { bucket: string; spend: number; attributedRevenue: number };

export type DashboardOverview = {
  layout: DashboardLayout;
  alerts: AlertItem[];
  milestone: DashboardMilestone;
  recommendations: ConsultingRecommendation[];
  metrics: DashboardMetric[];
  series: Record<DashboardMetricKey, Series>;
  bySource: BreakdownSlice[];
  matrix: { buckets: string[]; rows: DashboardMatrixRow[] };
  channelSplit: DashboardChannelPoint[];
  topProducts: DashboardTopProduct[];
  customerMix: DashboardCustomerMix;
  funnel: DashboardFunnelStep[];
  paidMedia: DashboardPaidMediaPoint[];
};
