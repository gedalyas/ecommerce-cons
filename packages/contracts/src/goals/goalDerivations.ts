import { cacPercent } from "../marketing/contract";
import type { GoalInput, GoalMonth, GoalValues } from "./goals.types";

const ratio = (numerator: number, denominator: number) =>
  denominator > 0 ? numerator / denominator : null;

export type GoalQuantities = {
  totalSold: number;
  orders: number;
  sessions: number;
  paidTraffic: number;
  otherMarketing: number;
  newCustomers: number;
  repeatOrders: number;
};

export function quantitiesOf(input: GoalInput): GoalQuantities {
  const orders = ratio(input.totalSold, input.averageTicket) ?? 0;
  const sessions = input.conversionRate > 0 ? orders / (input.conversionRate / 100) : 0;
  const repeatOrders = orders * (input.repurchaseRate / 100);
  return {
    totalSold: input.totalSold,
    orders,
    sessions,
    paidTraffic: input.paidTraffic,
    otherMarketing: input.otherMarketing,
    newCustomers: orders - repeatOrders,
    repeatOrders,
  };
}

export function valuesOf(q: GoalQuantities): GoalValues {
  const totalMarketing = q.paidTraffic + q.otherMarketing;
  return {
    totalSold: q.totalSold,
    orders: q.orders,
    averageTicket: ratio(q.totalSold, q.orders),
    paidTraffic: q.paidTraffic,
    roas: ratio(q.totalSold, q.paidTraffic),
    totalMarketing,
    roi: totalMarketing > 0 ? ((q.totalSold - totalMarketing) / totalMarketing) * 100 : null,
    cpa: ratio(totalMarketing, q.orders),
    sessions: q.sessions,
    conversionRate: q.sessions > 0 ? (q.orders / q.sessions) * 100 : null,
    costPerSession: ratio(totalMarketing, q.sessions),
    revenuePerSession: ratio(q.totalSold, q.sessions),
    repurchaseRate: q.orders > 0 ? (q.repeatOrders / q.orders) * 100 : null,
    newCustomers: q.newCustomers,
    cac: cacPercent(totalMarketing, q.totalSold),
  };
}

export const deriveGoal = (input: GoalInput): GoalValues => valuesOf(quantitiesOf(input));

export const emptyQuantities: GoalQuantities = {
  totalSold: 0,
  orders: 0,
  sessions: 0,
  paidTraffic: 0,
  otherMarketing: 0,
  newCustomers: 0,
  repeatOrders: 0,
};

export const addQuantities = (
  a: GoalQuantities,
  b: GoalQuantities,
  weight = 1,
): GoalQuantities => ({
  totalSold: a.totalSold + b.totalSold * weight,
  orders: a.orders + b.orders * weight,
  sessions: a.sessions + b.sessions * weight,
  paidTraffic: a.paidTraffic + b.paidTraffic * weight,
  otherMarketing: a.otherMarketing + b.otherMarketing * weight,
  newCustomers: a.newCustomers + b.newCustomers * weight,
  repeatOrders: a.repeatOrders + b.repeatOrders * weight,
});

const DAY = 86_400_000;
const dayIndex = (iso: string) => Math.round(new Date(`${iso}T00:00:00.000Z`).getTime() / DAY);
const daysInMonth = (year: number, month: number) =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();
const pad = (n: number) => String(n).padStart(2, "0");

export function monthShares(
  inicio: string,
  fim: string,
): { year: number; month: number; share: number }[] {
  const start = dayIndex(inicio);
  const end = dayIndex(fim);
  if (end < start) return [];
  const shares: { year: number; month: number; share: number }[] = [];
  let year = Number(inicio.slice(0, 4));
  let month = Number(inicio.slice(5, 7));
  for (;;) {
    const length = daysInMonth(year, month);
    const first = dayIndex(`${year}-${pad(month)}-01`);
    const last = first + length - 1;
    const from = Math.max(first, start);
    const to = Math.min(last, end);
    if (from <= to) shares.push({ year, month, share: (to - from + 1) / length });
    if (last >= end) break;
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return shares;
}

export function prorateGoals(
  plans: ReadonlyMap<string, GoalMonth>,
  inicio: string,
  fim: string,
): GoalValues | null {
  let total = emptyQuantities;
  let found = false;
  for (const { year, month, share } of monthShares(inicio, fim)) {
    const plan = plans.get(`${year}-${month}`);
    if (!plan) continue;
    found = true;
    total = addQuantities(total, quantitiesOf(plan), share);
  }
  return found ? valuesOf(total) : null;
}

export const pacingOf = (additive: boolean, elapsedPercent: number) =>
  additive ? Math.min(100, Math.max(0, elapsedPercent)) : 100;

export function elapsedPercent(inicio: string, fim: string, today: string) {
  const length = dayIndex(fim) - dayIndex(inicio) + 1;
  const elapsed = dayIndex(today) - dayIndex(inicio) + 1;
  return length > 0 ? Math.min(100, Math.max(0, (elapsed / length) * 100)) : 0;
}

export const progressOf = (actual: number | null, goal: number | null) =>
  actual == null || goal == null || goal === 0 ? null : (actual / goal) * 100;
