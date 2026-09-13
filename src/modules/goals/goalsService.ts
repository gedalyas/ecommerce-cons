/**
 * Goals orchestrator: the plan (reads and writes), the actuals of a window
 * through the other modules' contracts, and the Realizado × Meta cards.
 * Server-only.
 */
import { prismaClient } from "@/shared/dependencies/prismaClient";
import { PROTOTYPE_TODAY } from "@/shared/config/prototype";
import { customersAggregate } from "@/modules/customers/contract.server";
import {
  adSpendAggregate,
  adSpendByBucket,
  trafficAggregate,
  trafficByBucket,
} from "@/modules/marketing/contract.server";
import { expandCosts, type CostRule } from "@/modules/money/contract";
import { costRulesFor } from "@/modules/money/contract.server";
import { ordersAggregate, ordersByBucket } from "@/modules/orders/contract.server";
import type { PeriodSearch } from "@/shared/utils/period";
import { toWindow, type Window } from "@/shared/utils/periodWindow";
import {
  elapsedPercent,
  pacingOf,
  progressOf,
  prorateGoals,
  valuesOf,
  type GoalQuantities,
} from "./goalDerivations";
import {
  goalDefinitions,
  type GoalCard,
  type GoalMonth,
  type GoalsPlanning,
  type GoalsScreen,
  type GoalsSummary,
  type GoalValues,
} from "./goals.types";
import { planYears, type GoalPlanInput, type GoalsSearch } from "./goalsSchema";

async function clientIdFor(slug: string) {
  const client = await prismaClient.client.findUnique({ where: { slug }, select: { id: true } });
  if (!client) throw new Error(`Unknown client "${slug}"`);
  return client.id;
}

const toMonth = (r: {
  month: number;
  totalSold: { toString(): string };
  averageTicket: { toString(): string };
  conversionRate: { toString(): string };
  paidTraffic: { toString(): string };
  otherMarketing: { toString(): string };
  repurchaseRate: { toString(): string };
}): GoalMonth => ({
  month: r.month,
  totalSold: Number(r.totalSold),
  averageTicket: Number(r.averageTicket),
  conversionRate: Number(r.conversionRate),
  paidTraffic: Number(r.paidTraffic),
  otherMarketing: Number(r.otherMarketing),
  repurchaseRate: Number(r.repurchaseRate),
});

// ---------------------------------------------------------------------------
// Plan
// ---------------------------------------------------------------------------

async function planOf(clientId: string, year: number): Promise<GoalMonth[]> {
  const rows = await prismaClient.goal.findMany({
    where: { clientId, year },
    orderBy: { month: "asc" },
  });
  return rows.map(toMonth);
}

/** Replaces the whole year: months left out of the input are deleted. */
export async function savePlan(clientSlug: string, input: GoalPlanInput): Promise<GoalMonth[]> {
  const clientId = await clientIdFor(clientSlug);
  await prismaClient.$transaction([
    prismaClient.goal.deleteMany({ where: { clientId, year: input.year } }),
    ...(input.months.length
      ? [
          prismaClient.goal.createMany({
            data: input.months.map((m) => ({ clientId, year: input.year, ...m })),
          }),
        ]
      : []),
  ]);
  return planOf(clientId, input.year);
}

// ---------------------------------------------------------------------------
// Actuals
// ---------------------------------------------------------------------------

type Actuals = GoalQuantities & { sessionsOrders: number; salesMarketing: number };

const actualValues = (a: Actuals): GoalValues => {
  const v = valuesOf(a);
  const totalMarketing = a.paidTraffic + a.salesMarketing;
  const orders = a.orders;
  return {
    ...v,
    totalMarketing,
    roi: totalMarketing > 0 ? ((a.totalSold - totalMarketing) / totalMarketing) * 100 : null,
    cpa: orders > 0 ? totalMarketing / orders : null,
    conversionRate: a.sessions > 0 ? (a.sessionsOrders / a.sessions) * 100 : null,
    costPerSession: a.sessions > 0 ? totalMarketing / a.sessions : null,
    cac: a.newCustomers > 0 ? totalMarketing / a.newCustomers : null,
  };
};

async function windowActuals(
  clientId: string,
  w: Window,
  calendar: { inicio: string; fim: string },
  rules: readonly CostRule[],
): Promise<Actuals> {
  const [orders, traffic, ads, customers] = await Promise.all([
    ordersAggregate(clientId, w, null),
    trafficAggregate(clientId, w),
    adSpendAggregate(clientId, w),
    customersAggregate(clientId, w, null),
  ]);
  const paidTraffic = ads.spend + ads.platformFee;
  const costs = expandCosts(rules, calendar, {
    ecommerce: orders.ecommerce,
    marketplace: orders.marketplace,
    adSpend: ads.spend,
  });
  return {
    totalSold: orders.revenue,
    orders: orders.orders,
    sessions: traffic.sessions,
    sessionsOrders: orders.ecommerce.orders,
    paidTraffic,
    otherMarketing: costs.salesMarketing,
    salesMarketing: costs.salesMarketing,
    newCustomers: customers.newCustomers,
    repeatOrders: orders.repeatOrders,
  };
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

const resumoWindow = (search: PeriodSearch & GoalsSearch) =>
  search.acumulado ? { inicio: `${search.fim.slice(0, 4)}-01-01`, fim: search.fim } : search;

async function goalsSummary(
  clientId: string,
  search: PeriodSearch & GoalsSearch,
): Promise<GoalsSummary> {
  const { inicio, fim } = resumoWindow(search);
  const years = [Number(inicio.slice(0, 4)), Number(fim.slice(0, 4))];
  const [rules, plans] = await Promise.all([
    costRulesFor(clientId),
    prismaClient.goal.findMany({ where: { clientId, year: { in: years } } }),
  ]);
  const facts = await windowActuals(clientId, toWindow({ inicio, fim }), { inicio, fim }, rules);
  const actual = actualValues(facts);
  const goal = prorateGoals(
    new Map(plans.map((p) => [`${p.year}-${p.month}`, toMonth(p)])),
    inicio,
    fim,
  );
  const elapsed = elapsedPercent(inicio, fim, PROTOTYPE_TODAY);
  const cards: GoalCard[] = goalDefinitions.map((d) => {
    const g = goal?.[d.key] ?? null;
    const a = actual[d.key];
    return {
      key: d.key,
      label: d.label,
      unit: d.unit,
      group: d.group,
      goodWhen: d.goodWhen,
      actual: a,
      goal: g,
      difference: a != null && g != null ? a - g : null,
      progress: progressOf(a, g),
      pacing: g == null ? null : pacingOf(d.additive, elapsed),
    };
  });
  return { cards, window: { inicio, fim }, elapsed, empty: goal == null };
}

async function goalsPlanning(clientId: string, year: number): Promise<GoalsPlanning> {
  return { year, years: [...planYears], months: await planOf(clientId, year) };
}

export async function goalsScreen(
  clientSlug: string,
  search: PeriodSearch & GoalsSearch,
): Promise<GoalsScreen> {
  const clientId = await clientIdFor(clientSlug);
  switch (search.aba) {
    case "resumo":
      return { aba: "resumo", summary: await goalsSummary(clientId, search) };
    case "planejamento":
      return { aba: "planejamento", planning: await goalsPlanning(clientId, search.ano) };
  }
}

// ---------------------------------------------------------------------------
// Suggestion from history
// ---------------------------------------------------------------------------

const GROWTH = 1.1;
const round = (v: number, decimals = 0) => {
  const f = 10 ** decimals;
  return Math.round(v * f) / f;
};

/**
 * A plan for `year` from the previous year's monthly actuals plus 10%.
 * Months without history take the average of the months that have it.
 */
export async function suggestPlan(clientSlug: string, year: number): Promise<GoalMonth[]> {
  const clientId = await clientIdFor(clientSlug);
  const previous = year - 1;
  const w = toWindow({ inicio: `${previous}-01-01`, fim: `${previous}-12-31` });
  const [rules, orders, traffic, ads] = await Promise.all([
    costRulesFor(clientId),
    ordersByBucket(clientId, w, "month", null),
    trafficByBucket(clientId, w, "month"),
    adSpendByBucket(clientId, w, "month"),
  ]);
  const byMonth = <T extends { bucket: string }>(rows: T[]) =>
    new Map(rows.map((r) => [Number(r.bucket.slice(5, 7)), r]));
  const o = byMonth(orders);
  const t = byMonth(traffic);
  const a = byMonth(ads);
  const months: GoalMonth[] = [];
  for (let month = 1; month <= 12; month += 1) {
    const om = o.get(month);
    if (!om || om.orders === 0) continue;
    const am = a.get(month);
    const spend = am?.spend ?? 0;
    const last = new Date(Date.UTC(previous, month, 0)).getUTCDate();
    const calendar = {
      inicio: `${previous}-${String(month).padStart(2, "0")}-01`,
      fim: `${previous}-${String(month).padStart(2, "0")}-${last}`,
    };
    const costs = expandCosts(rules, calendar, {
      ecommerce: om.ecommerce,
      marketplace: om.marketplace,
      adSpend: spend,
    });
    const sessions = t.get(month)?.sessions ?? 0;
    months.push({
      month,
      totalSold: round(om.revenue * GROWTH),
      averageTicket: round(om.revenue / om.orders),
      conversionRate: sessions > 0 ? round((om.ecommerce.orders / sessions) * 100, 2) : 0,
      paidTraffic: round((spend + (am?.platformFee ?? 0)) * GROWTH),
      otherMarketing: round(costs.salesMarketing),
      repurchaseRate: round((om.repeatOrders / om.orders) * 100, 1),
    });
  }
  if (months.length === 0) return [];
  const avg = (pick: (m: GoalMonth) => number, decimals = 0) =>
    round(months.reduce((s, m) => s + pick(m), 0) / months.length, decimals);
  const filler: Omit<GoalMonth, "month"> = {
    totalSold: avg((m) => m.totalSold),
    averageTicket: avg((m) => m.averageTicket),
    conversionRate: avg((m) => m.conversionRate, 2),
    paidTraffic: avg((m) => m.paidTraffic),
    otherMarketing: avg((m) => m.otherMarketing),
    repurchaseRate: avg((m) => m.repurchaseRate, 1),
  };
  const have = new Map(months.map((m) => [m.month, m]));
  return Array.from({ length: 12 }, (_, i) => have.get(i + 1) ?? { month: i + 1, ...filler });
}
