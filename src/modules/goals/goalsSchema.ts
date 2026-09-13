import { z } from "zod";

export const goalsTabs = ["resumo", "planejamento"] as const;
export type GoalsTab = (typeof goalsTabs)[number];

/** Years the planning grid offers. */
export const planYears = [2025, 2026, 2027] as const;
const firstYear = planYears[0];
const lastYear = planYears[planYears.length - 1]!;

export const goalsSearchSchema = z.object({
  aba: z.enum(goalsTabs).catch("resumo"),
  /** Resumo: measure from the first day of the year to the end of the period. */
  acumulado: z.boolean().catch(false),
  ano: z.number().int().min(firstYear).max(lastYear).catch(2026),
});

export type GoalsSearch = z.infer<typeof goalsSearchSchema>;
export const defaultGoalsSearch: GoalsSearch = goalsSearchSchema.parse({});

const money = z.number().min(0).max(1_000_000_000);
const percent = z.number().min(0).max(100);

export const goalMonthSchema = z.object({
  month: z.number().int().min(1).max(12),
  totalSold: money,
  averageTicket: money,
  conversionRate: percent,
  paidTraffic: money,
  otherMarketing: money,
  repurchaseRate: percent,
});

export const goalPlanSchema = z.object({
  year: z.number().int().min(firstYear).max(lastYear),
  months: z.array(goalMonthSchema).max(12),
});

export type GoalPlanInput = z.infer<typeof goalPlanSchema>;

export const suggestSchema = z.object({
  year: z.number().int().min(firstYear).max(lastYear),
});
