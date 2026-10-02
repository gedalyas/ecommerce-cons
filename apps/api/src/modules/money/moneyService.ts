import type { SalesPlatform } from "@ecommerce/database/enums";
import { prismaClient } from "@ecommerce/database/client";
import { sectionFor } from "@/modules/consulting/contract";
import { moneyLiveKpis } from "./moneyLiveKpis";
import { adSpendAggregate, adSpendByBucket } from "@/modules/marketing/contract";
import type { AdSpendAggregate } from "@ecommerce/contracts/marketing";
import { ordersAggregate, ordersByBucket } from "@/modules/orders/contract";
import type { OrdersAggregate } from "@ecommerce/contracts/orders";
import { metricValue } from "@ecommerce/contracts/shared/metricValue";
import type { Channel, PeriodSearch } from "@ecommerce/contracts/shared/period";
import { bucketWindows, resolvePeriod, truncUnit } from "@ecommerce/contracts/shared/periodWindow";
import { expandCosts, ruleAmount, type CostWindow } from "./costEngine";
import {
  subcategoryLabel,
  dreLineKeys,
  type CostRule,
  type CostRuleRow,
  type MarketingCostLine,
  type DreIndicator,
  type DreIndicatorKey,
  type DreLineKey,
  type MoneyDre,
  type MoneyScreen,
  type MoneyTabData,
} from "@ecommerce/contracts/money";
import { computeDre, computeDreIndicators, type DreFacts } from "./dre";
import type { CostInput, MoneySearch } from "@ecommerce/contracts/money";

const isoDay = (date: Date) => date.toISOString().slice(0, 10);
const dateOf = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

const platformFor = (channel: Channel): SalesPlatform | null =>
  channel === "ecommerce" ? "ECOMMERCE" : channel === "marketplace" ? "MARKETPLACE" : null;

const toRow = (r: {
  id: string;
  name: string;
  description: string | null;
  businessUnit: CostRule["businessUnit"];
  category: CostRule["category"];
  subcategory: string;
  frequency: CostRule["frequency"];
  value: { toString(): string };
  startDate: Date;
  endDate: Date | null;
}): CostRuleRow => ({
  id: r.id,
  name: r.name,
  description: r.description ?? "",
  businessUnit: r.businessUnit,
  category: r.category,
  subcategory: r.subcategory,
  frequency: r.frequency,
  value: Number(r.value),
  startDate: isoDay(r.startDate),
  endDate: r.endDate ? isoDay(r.endDate) : null,
});

export async function costRulesFor(clientId: string): Promise<CostRuleRow[]> {
  const rows = await prismaClient.costExpense.findMany({
    where: { clientId },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  return rows.map(toRow);
}

export async function createCost(clientId: string, input: CostInput): Promise<CostRuleRow> {
  const row = await prismaClient.costExpense.create({
    data: {
      clientId,
      name: input.name,
      description: input.description || null,
      businessUnit: input.businessUnit,
      category: input.category,
      subcategory: input.subcategory,
      frequency: input.frequency,
      value: input.value,
      startDate: dateOf(input.startDate),
      endDate: input.endDate ? dateOf(input.endDate) : null,
    },
  });
  return toRow(row);
}

export async function updateCost(
  clientId: string,
  id: string,
  input: CostInput,
): Promise<CostRuleRow> {
  const row = await prismaClient.costExpense.update({
    where: { id, clientId },
    data: {
      name: input.name,
      description: input.description || null,
      businessUnit: input.businessUnit,
      category: input.category,
      subcategory: input.subcategory,
      frequency: input.frequency,
      value: input.value,
      startDate: dateOf(input.startDate),
      endDate: input.endDate ? dateOf(input.endDate) : null,
    },
  });
  return toRow(row);
}

export async function deleteCost(clientId: string, id: string): Promise<void> {
  await prismaClient.costExpense.delete({ where: { id, clientId } });
}

const factsFrom = (
  orders: OrdersAggregate,
  ads: AdSpendAggregate | null,
  rules: readonly CostRule[],
  calendar: CostWindow,
): DreFacts => {
  const adSpend = ads?.spend ?? 0;
  const activity = { ecommerce: orders.ecommerce, marketplace: orders.marketplace, adSpend };
  return {
    revenue: orders.revenue,
    productRevenue: orders.productRevenue,
    discounts: orders.discounts,
    shipping: orders.shipping,
    orders: orders.orders,
    cogs: orders.cogs,
    adSpend,
    adPlatformFee: ads?.platformFee ?? 0,
    costs: expandCosts(rules, calendar, activity),
  };
};

const shippingCostOf = (
  orders: OrdersAggregate,
  adSpend: number,
  rules: readonly CostRule[],
  calendar: CostWindow,
) =>
  rules
    .filter((r) => r.category === "COGS" && r.subcategory === "shipping")
    .reduce(
      (sum, r) =>
        sum +
        ruleAmount(r, calendar, {
          ecommerce: orders.ecommerce,
          marketplace: orders.marketplace,
          adSpend,
        }),
      0,
    );

const lineLabel: Record<DreLineKey, { label: string; level: number }> = {
  revenue: { label: "Receita total", level: 0 },
  productRevenue: { label: "Receita de produtos", level: 1 },
  shippingRevenue: { label: "Receita de frete", level: 1 },
  totalCosts: { label: "Custos totais", level: 0 },
  cogs: { label: "CMV", level: 1 },
  sellingCosts: { label: "Checkout, gateway, frete, impostos e marketplace", level: 1 },
  grossProfit: { label: "Lucro bruto", level: 0 },
  marketingExpenses: { label: "Despesas de marketing", level: 0 },
  contributionMargin: { label: "Margem de contribuição", level: 0 },
  operatingExpenses: { label: "Despesas operacionais", level: 0 },
  netProfit: { label: "Lucro líquido", level: 0 },
};

const indicatorDefinitions: {
  key: DreIndicatorKey;
  label: string;
  unit: "percent" | "currency";
  goodWhen: "up" | "down";
}[] = [
  { key: "grossMargin", label: "Margem bruta", unit: "percent", goodWhen: "up" },
  {
    key: "contributionMarginRate",
    label: "Margem de contribuição",
    unit: "percent",
    goodWhen: "up",
  },
  { key: "netMargin", label: "Margem líquida", unit: "percent", goodWhen: "up" },
  { key: "cogsRate", label: "CMV", unit: "percent", goodWhen: "down" },
  { key: "sellingCostRate", label: "Taxas e custos de venda", unit: "percent", goodWhen: "down" },
  { key: "marketingRate", label: "Marketing sobre receita", unit: "percent", goodWhen: "down" },
  {
    key: "shippingCostPerOrder",
    label: "Custo de frete por pedido",
    unit: "currency",
    goodWhen: "down",
  },
];

async function windowDre(
  clientId: string,
  search: PeriodSearch,
  rules: readonly CostRule[],
): Promise<{
  indicators: DreIndicator[];
  current: DreFacts;
  previous: DreFacts | null;
  costCoverage: number | null;
}> {
  const period = resolvePeriod(search);
  const platform = platformFor(search.canal);
  const mediaApplies = search.canal !== "marketplace";
  const previousCalendar = period.previous
    ? bucketWindows(period.previous, "dia").reduce(
        (acc, b, i, all) => ({
          inicio: i === 0 ? b.inicio : acc.inicio,
          fim: all[all.length - 1]!.fim,
        }),
        { inicio: "", fim: "" },
      )
    : null;
  const [orders, prevOrders, ads, prevAds] = await Promise.all([
    ordersAggregate(clientId, period.current, platform),
    period.previous ? ordersAggregate(clientId, period.previous, platform) : null,
    mediaApplies ? adSpendAggregate(clientId, period.current) : null,
    mediaApplies && period.previous ? adSpendAggregate(clientId, period.previous) : null,
  ]);
  const calendar = { inicio: search.inicio, fim: search.fim };
  const current = factsFrom(orders, ads, rules, calendar);
  const previous =
    prevOrders && previousCalendar ? factsFrom(prevOrders, prevAds, rules, previousCalendar) : null;
  const indicatorsOf = (f: DreFacts, o: OrdersAggregate, c: CostWindow) =>
    computeDreIndicators(f, computeDre(f), shippingCostOf(o, f.adSpend, rules, c));
  const cur = indicatorsOf(current, orders, calendar);
  const prev =
    previous && prevOrders && previousCalendar
      ? indicatorsOf(previous, prevOrders, previousCalendar)
      : null;
  return {
    indicators: indicatorDefinitions.map((d) => ({
      ...d,
      metric: metricValue(d.unit, cur[d.key], prev?.[d.key] ?? null),
    })),
    current,
    previous,
    costCoverage: orders.costCoverage,
  };
}

export async function moneyDre(clientId: string, search: PeriodSearch): Promise<MoneyDre> {
  const rules = await costRulesFor(clientId);
  const period = resolvePeriod(search);
  const unit = truncUnit[period.por];
  const platform = platformFor(search.canal);
  const mediaApplies = search.canal !== "marketplace";
  const buckets = bucketWindows(period.current, period.por);
  const [{ indicators, current, previous, costCoverage }, orders, ads] = await Promise.all([
    windowDre(clientId, search, rules),
    ordersByBucket(clientId, period.current, unit, platform),
    mediaApplies ? adSpendByBucket(clientId, period.current, unit) : [],
  ]);
  const ordersMap = new Map(orders.map((o) => [o.bucket, o]));
  const adsMap = new Map(ads.map((a) => [a.bucket, a]));
  const empty: OrdersAggregate = {
    revenue: 0,
    orders: 0,
    captured: 0,
    capturedOrders: 0,
    cogs: 0,
    costCoverage: null,
    repeatOrders: 0,
    productRevenue: 0,
    items: 0,
    discounts: 0,
    shipping: 0,
    ecommerce: { orders: 0, revenue: 0 },
    marketplace: { orders: 0, revenue: 0 },
  };
  const perBucket = buckets.map((b) =>
    computeDre(factsFrom(ordersMap.get(b.bucket) ?? empty, adsMap.get(b.bucket) ?? null, rules, b)),
  );
  const currentLines = computeDre(current);
  const previousLines = previous ? computeDre(previous) : null;
  return {
    indicators,
    costCoverage,
    matrix: {
      buckets: buckets.map((b) => b.bucket),
      rows: dreLineKeys.map((key) => ({
        key,
        ...lineLabel[key],
        values: perBucket.map((lines) => lines[key]),
        total: currentLines[key],
        previousTotal: previousLines?.[key] ?? null,
      })),
    },
  };
}

export async function marketingCostLines(
  clientId: string,
  search: PeriodSearch,
): Promise<MarketingCostLine[]> {
  const period = resolvePeriod(search);
  const [rules, orders, ads] = await Promise.all([
    costRulesFor(clientId),
    ordersAggregate(clientId, period.current, null),
    adSpendAggregate(clientId, period.current),
  ]);
  const calendar = { inicio: search.inicio, fim: search.fim };
  const activity = {
    ecommerce: orders.ecommerce,
    marketplace: orders.marketplace,
    adSpend: ads.spend,
  };
  const lines = new Map<string, MarketingCostLine>();
  for (const rule of rules) {
    if (rule.category !== "SALES_MARKETING") continue;
    const amount = ruleAmount(rule, calendar, activity);
    if (amount <= 0) continue;
    const key = `${rule.subcategory}:${rule.businessUnit}`;
    const line = lines.get(key) ?? {
      key,
      label: subcategoryLabel("SALES_MARKETING", rule.subcategory),
      businessUnit: rule.businessUnit,
      amount: 0,
    };
    line.amount += amount;
    lines.set(key, line);
  }
  return [...lines.values()].sort((a, b) => b.amount - a.amount);
}

async function moneyTab(
  clientId: string,
  search: PeriodSearch & MoneySearch,
): Promise<MoneyTabData> {
  switch (search.aba) {
    case "visao": {
      const { indicators, costCoverage } = await windowDre(
        clientId,
        search,
        await costRulesFor(clientId),
      );
      return { aba: "visao", indicators, costCoverage };
    }
    case "dre":
      return { aba: "dre", dre: await moneyDre(clientId, search) };
    case "custos":
      return { aba: "custos", rules: await costRulesFor(clientId) };
  }
}

export async function moneyScreen(
  clientId: string,
  search: PeriodSearch & MoneySearch,
  canEdit: boolean,
): Promise<MoneyScreen> {
  const tab = await moneyTab(clientId, search);
  const indicators =
    tab.aba === "visao"
      ? tab.indicators
      : (await windowDre(clientId, search, await costRulesFor(clientId))).indicators;
  const section = await sectionFor(clientId, "money", moneyLiveKpis(indicators), canEdit);
  return { section, ...tab };
}
