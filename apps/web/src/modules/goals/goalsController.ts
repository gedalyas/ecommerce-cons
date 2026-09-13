import { createServerFn } from "@tanstack/react-start";
import {
  goalPlanSchema,
  goalsSearchSchema,
  suggestSchema,
  type GoalMonth,
  type GoalsScreen,
} from "@ecommerce/contracts/goals";
import { parsePeriodSearch, type PeriodSearch } from "@ecommerce/contracts/shared/period";
import { apiFetch } from "@/shared/dependencies/apiClient";

export const getGoalsScreen = createServerFn({ method: "GET" })
  .validator((input: Partial<PeriodSearch> & Record<string, unknown>) => ({
    ...parsePeriodSearch(input),
    ...goalsSearchSchema.parse(input),
  }))
  .handler(async ({ data }) => apiFetch<GoalsScreen>("/goals", { query: data }));

export const saveGoalPlan = createServerFn({ method: "POST" })
  .validator((input: unknown) => goalPlanSchema.parse(input))
  .handler(async ({ data }) => apiFetch<GoalMonth[]>("/goals/plan", { method: "PUT", body: data }));

export const suggestGoalPlan = createServerFn({ method: "GET" })
  .validator((input: unknown) => suggestSchema.parse(input))
  .handler(async ({ data }) => apiFetch<GoalMonth[]>("/goals/suggestion", { query: data }));
