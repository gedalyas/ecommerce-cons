import type { MetricUnit } from "../shared/metric.types";
import type { GoalsTab } from "./goalsSchema";

/** The six drivers the user types per month; everything else is derived. */
export const goalInputKeys = [
  "totalSold",
  "averageTicket",
  "conversionRate",
  "paidTraffic",
  "otherMarketing",
  "repurchaseRate",
] as const;
export type GoalInputKey = (typeof goalInputKeys)[number];
export type GoalInput = Record<GoalInputKey, number>;

export const goalDerivedKeys = [
  "orders",
  "sessions",
  "roas",
  "totalMarketing",
  "roi",
  "cpa",
  "newCustomers",
  "cac",
] as const;
export type GoalDerivedKey = (typeof goalDerivedKeys)[number];

/** The fifteen KPIs of the Resumo tab (the 14 of the plan plus the two per-session ratios). */
export const goalKpiKeys = [
  "totalSold",
  "orders",
  "averageTicket",
  "paidTraffic",
  "roas",
  "totalMarketing",
  "roi",
  "cpa",
  "sessions",
  "conversionRate",
  "costPerSession",
  "revenuePerSession",
  "repurchaseRate",
  "newCustomers",
  "cac",
] as const;
export type GoalKpiKey = (typeof goalKpiKeys)[number];
export type GoalValues = Record<GoalKpiKey, number | null>;

export type GoalGroup = "vendas" | "marketing" | "trafego" | "recompra";

export const goalGroupLabel: Record<GoalGroup, string> = {
  vendas: "Vendas",
  marketing: "Marketing",
  trafego: "Tráfego e-commerce",
  recompra: "Recompra",
};

export type GoalDefinition = {
  key: GoalKpiKey;
  label: string;
  unit: MetricUnit;
  group: GoalGroup;
  /** Sums over time (revenue, orders) or is a ratio (ticket, rates). */
  additive: boolean;
  goodWhen: "up" | "down";
};

export const goalDefinitions: readonly GoalDefinition[] = [
  {
    key: "totalSold",
    label: "Total vendido",
    unit: "currency",
    group: "vendas",
    additive: true,
    goodWhen: "up",
  },
  {
    key: "orders",
    label: "Número de pedidos",
    unit: "count",
    group: "vendas",
    additive: true,
    goodWhen: "up",
  },
  {
    key: "averageTicket",
    label: "Ticket médio",
    unit: "currency",
    group: "vendas",
    additive: false,
    goodWhen: "up",
  },
  {
    key: "paidTraffic",
    label: "Investimento em tráfego pago",
    unit: "currency",
    group: "marketing",
    additive: true,
    goodWhen: "down",
  },
  {
    key: "roas",
    label: "ROAS",
    unit: "multiplier",
    group: "marketing",
    additive: false,
    goodWhen: "up",
  },
  {
    key: "totalMarketing",
    label: "Investimento total em marketing",
    unit: "currency",
    group: "marketing",
    additive: true,
    goodWhen: "down",
  },
  {
    key: "roi",
    label: "ROI",
    unit: "percent",
    group: "marketing",
    additive: false,
    goodWhen: "up",
  },
  {
    key: "cpa",
    label: "CPA",
    unit: "currency",
    group: "marketing",
    additive: false,
    goodWhen: "down",
  },
  {
    key: "sessions",
    label: "Sessões",
    unit: "count",
    group: "trafego",
    additive: true,
    goodWhen: "up",
  },
  {
    key: "conversionRate",
    label: "Taxa de conversão",
    unit: "percent",
    group: "trafego",
    additive: false,
    goodWhen: "up",
  },
  {
    key: "costPerSession",
    label: "Custo por sessão",
    unit: "currency",
    group: "trafego",
    additive: false,
    goodWhen: "down",
  },
  {
    key: "revenuePerSession",
    label: "Receita por sessão",
    unit: "currency",
    group: "trafego",
    additive: false,
    goodWhen: "up",
  },
  {
    key: "repurchaseRate",
    label: "% Recompra",
    unit: "percent",
    group: "recompra",
    additive: false,
    goodWhen: "up",
  },
  {
    key: "newCustomers",
    label: "Novos clientes",
    unit: "count",
    group: "recompra",
    additive: true,
    goodWhen: "up",
  },
  {
    key: "cac",
    label: "CAC",
    unit: "currency",
    group: "recompra",
    additive: false,
    goodWhen: "down",
  },
];

export const goalInputLabel: Record<GoalInputKey, { label: string; unit: MetricUnit }> = {
  totalSold: { label: "Total vendido", unit: "currency" },
  averageTicket: { label: "Ticket médio", unit: "currency" },
  conversionRate: { label: "Taxa de conversão", unit: "percent" },
  paidTraffic: { label: "Investimento em tráfego pago", unit: "currency" },
  otherMarketing: { label: "Outros investimentos em marketing", unit: "currency" },
  repurchaseRate: { label: "% Recompra", unit: "percent" },
};

/** One month of the plan, as stored. */
export type GoalMonth = GoalInput & { month: number };

export type GoalPlan = { year: number; months: GoalMonth[] };

export type GoalCard = {
  key: GoalKpiKey;
  label: string;
  unit: MetricUnit;
  group: GoalGroup;
  goodWhen: "up" | "down";
  actual: number | null;
  goal: number | null;
  /** actual − goal, in the metric's unit. */
  difference: number | null;
  /** actual ÷ goal, percent. */
  progress: number | null;
  /** Where the store should be by now to hit the goal, percent of the goal. */
  pacing: number | null;
};

export type GoalsSummary = {
  cards: GoalCard[];
  /** The window the actuals and the prorated goal cover. */
  window: { inicio: string; fim: string };
  /** Days of the window already elapsed over its length, percent. */
  elapsed: number;
  /** True when no month of the window has a goal. */
  empty: boolean;
};

export type GoalsPlanning = {
  year: number;
  years: number[];
  months: GoalMonth[];
};

export type GoalsScreen =
  | { aba: Extract<GoalsTab, "resumo">; summary: GoalsSummary }
  | { aba: Extract<GoalsTab, "planejamento">; planning: GoalsPlanning };
