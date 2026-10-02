import { z } from "zod";

export const goalsTabs = ["resumo", "planejamento"] as const;
export type GoalsTab = (typeof goalsTabs)[number];

const firstYear = 2020;
const lastYear = 2100;

export const goalsSearchSchema = z.object({
  aba: z.enum(goalsTabs).catch("resumo"),
  acumulado: z.boolean().catch(false),
  ano: z.number().int().min(firstYear).max(lastYear).nullable().catch(null),
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
