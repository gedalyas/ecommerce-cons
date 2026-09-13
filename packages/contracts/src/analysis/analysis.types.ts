import type { MetricUnit, MetricValue, Series } from "../shared/metric.types";

export const analysisMetricKeys = [
  "totalSold",
  "orders",
  "sessions",
  "conversionRate",
  "averageTicket",
  "repurchaseRate",
  "discountRate",
  "cancellationRate",
  "roas",
  "roi",
  "cpa",
  "cac",
  "costPerSession",
  "cpc",
] as const;
export type AnalysisMetricKey = (typeof analysisMetricKeys)[number];

export const driverKeys = [
  ...analysisMetricKeys,
  "adSpend",
  "totalMarketing",
  "clicks",
  "ctr",
  "newUsersShare",
  "itemsPerOrder",
  "discounts",
  "capturedOrders",
  "repeatOrders",
  "newCustomers",
  "customers",
] as const;
export type DriverKey = (typeof driverKeys)[number];

export type AnalysisValues = Record<DriverKey, number | null>;

export type AnalysisFacts = {
  revenue: number;
  orders: number;
  capturedOrders: number;
  repeatOrders: number;
  items: number;
  discounts: number;
  productRevenue: number;
  sessions: number;
  users: number;
  newUsers: number;
  adSpend: number;
  adPlatformFee: number;
  clicks: number;
  impressions: number;
  customers: number;
  newCustomers: number;
  salesMarketingCosts: number;
};

export type DriverSection = "drove" | "signals";

export type DriverDefinition = {
  key: DriverKey;
  label: string;
  unit: MetricUnit;
  goodWhen: "up" | "down";
};

export type MetricDefinition = DriverDefinition & {
  key: AnalysisMetricKey;
  section: DriverSection;
  drivers: DriverKey[];
  levers: string[];
};

export type Verdict = "positivo" | "neutro" | "negativo";

export type Benchmark = { label: string; verdict: "abaixo" | "dentro" | "acima" | null };

export type DriverReading = DriverDefinition & { metric: MetricValue };

export type AnalysisNarrative = {
  verdict: Verdict;
  benchmark: Benchmark | null;
  title: string;
  diagnosis: string;
  levers: string;
};

export type AnalysisScreen = {
  metric: MetricDefinition;
  headline: MetricValue;
  series: Series;
  narrative: AnalysisNarrative;
  drivers: DriverReading[];
  comparison: { inicio: string; fim: string } | null;
};
