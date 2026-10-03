import { z } from "zod";
import {
  canViewArea,
  isScreenReleased,
  type AccessArea,
  type AreaAccess,
  type ScreenRelease,
  type StoreScreen,
} from "@ecommerce/contracts/auth";
import {
  isIsoDate,
  rangeLength,
  type Channel,
  type DateRange,
  type PeriodSearch,
} from "@ecommerce/contracts/shared/period";

const assistantToolNames = [
  "store_overview",
  "data_sources",
  "money_results",
  "products_sales",
  "marketing_channels",
  "customers_retention",
  "goals_progress",
] as const;
export type AssistantToolName = (typeof assistantToolNames)[number];

export const assistantToolLabel: Record<AssistantToolName, string> = {
  store_overview: "visão geral",
  data_sources: "fontes de dados",
  money_results: "dinheiro",
  products_sales: "produtos",
  marketing_channels: "canais de venda",
  customers_retention: "clientes",
  goals_progress: "metas",
};

type ToolNeed = { area: AccessArea | null; screen: StoreScreen | null };

const toolNeeds: Record<AssistantToolName, ToolNeed> = {
  store_overview: { area: null, screen: null },
  data_sources: { area: null, screen: null },
  money_results: { area: "MONEY", screen: "MONEY" },
  products_sales: { area: "DATA", screen: "PRODUCTS" },
  marketing_channels: { area: "MARKETING", screen: "MARKETING" },
  customers_retention: { area: "DATA", screen: "CUSTOMERS" },
  goals_progress: { area: "MANAGEMENT", screen: "GOALS" },
};

export type AssistantToolDefinition = {
  name: AssistantToolName;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, { type: "string"; description: string }>;
    additionalProperties: false;
  };
};

const periodProperties = {
  inicio: {
    type: "string" as const,
    description: "First day (YYYY-MM-DD). Omit to use the period the user selected.",
  },
  fim: {
    type: "string" as const,
    description: "Last day (YYYY-MM-DD). Omit to use the period the user selected.",
  },
};

const withPeriod = (name: AssistantToolName, description: string): AssistantToolDefinition => ({
  name,
  description,
  input_schema: { type: "object", properties: periodProperties, additionalProperties: false },
});

const definitions: AssistantToolDefinition[] = [
  withPeriod(
    "store_overview",
    "Headline KPIs of the period against the previous one (revenue, orders, ticket, conversion, " +
      "investment, ROAS, ROI, MER, CAC, CPA, net profit, contribution margin, customers, " +
      "repurchase), each with its data-quality note, plus the open alerts, revenue by source and " +
      "the consulting milestone progress.",
  ),
  {
    name: "data_sources",
    description:
      "Which source feeds each kind of data (sales, products, stock, traffic, ad spend…), its " +
      "status (connected, failing to sync, imported by hand, not connected) and how long ago it " +
      "last synced.",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
  },
  withPeriod(
    "money_results",
    "Income statement (DRE) of the period against the previous one: revenue, cost of goods, " +
      "fees, marketing, contribution margin, net profit and their rates, with the share of revenue " +
      "whose product cost is known.",
  ),
  withPeriod(
    "products_sales",
    "Best-selling products of the period (units, revenue, orders, cost, stock) and the stock " +
      "health of the catalogue (variants, out of stock, untracked, stock-out rate, coverage days).",
  ),
  withPeriod(
    "marketing_channels",
    "Sales by channel (own site and each marketplace) in the period: revenue and its change, " +
      "share, orders, average ticket, sessions, conversion, investment and ROAS.",
  ),
  withPeriod(
    "customers_retention",
    "Buyers in the period (total and first-time) and the store's retention: repurchase rate over " +
      "the last 90 days and 12-month lifetime value.",
  ),
  withPeriod(
    "goals_progress",
    "The store's goals for the period against what was achieved: actual, goal, progress and " +
      "pacing of each goal, and how much of the period has elapsed.",
  ),
];

export function canUseTool(
  name: AssistantToolName,
  access: AreaAccess,
  release: ScreenRelease,
): boolean {
  const { area, screen } = toolNeeds[name];
  return (!area || canViewArea(access, area)) && (!screen || isScreenReleased(release, screen));
}

export function toolsFor(access: AreaAccess, release: ScreenRelease): AssistantToolDefinition[] {
  return definitions.filter((tool) => canUseTool(tool.name, access, release));
}

export function isAssistantTool(name: string): name is AssistantToolName {
  return assistantToolNames.some((tool) => tool === name);
}

const MAX_TOOL_DAYS = 366;
const isoDate = z.string().refine(isIsoDate);
const toolPeriodSchema = z.object({ inicio: isoDate.optional(), fim: isoDate.optional() });

type ToolPeriod = { ok: true; period: DateRange } | { ok: false; message: string };

export function toolPeriodOf(input: unknown, selected: DateRange): ToolPeriod {
  const parsed = toolPeriodSchema.safeParse(input ?? {});
  if (!parsed.success)
    return { ok: false, message: "inicio and fim must be real YYYY-MM-DD dates." };
  const period = {
    inicio: parsed.data.inicio ?? selected.inicio,
    fim: parsed.data.fim ?? selected.fim,
  };
  if (period.inicio > period.fim) return { ok: false, message: "inicio comes after fim." };
  if (rangeLength(period) > MAX_TOOL_DAYS) {
    return { ok: false, message: "The period covers at most 366 days." };
  }
  return { ok: true, period };
}

export function toolSearchOf(period: DateRange, canal: Channel): PeriodSearch {
  return { ...period, por: "mes", comparar: "periodo-anterior", canal };
}

export function toolCallKey(name: AssistantToolName, period: DateRange): string {
  return name === "data_sources" ? name : `${name}:${period.inicio}:${period.fim}`;
}
