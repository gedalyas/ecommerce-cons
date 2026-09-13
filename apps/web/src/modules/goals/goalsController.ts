/**
 * Metas server functions: validate the input, call the service, return the
 * typed payload. The plan is written through POST.
 */
import { createServerFn } from "@tanstack/react-start";
import { PROTOTYPE_CLIENT_SLUG } from "@/shared/config/prototype";
import { parsePeriodSearch, type PeriodSearch } from "@ecommerce/contracts/shared/period";
import {
  goalPlanSchema,
  goalsSearchSchema,
  suggestSchema,
  type GoalsSearch,
} from "@ecommerce/contracts/goals";
import { goalsScreen, savePlan, suggestPlan } from "./goalsService";

export const getGoalsScreen = createServerFn({ method: "GET" })
  .validator((input: Partial<PeriodSearch & GoalsSearch>) => ({
    ...parsePeriodSearch(input),
    ...goalsSearchSchema.parse(input),
  }))
  .handler(async ({ data }) => goalsScreen(PROTOTYPE_CLIENT_SLUG, data));

export const saveGoalPlan = createServerFn({ method: "POST" })
  .validator((input: unknown) => goalPlanSchema.parse(input))
  .handler(async ({ data }) => savePlan(PROTOTYPE_CLIENT_SLUG, data));

export const suggestGoalPlan = createServerFn({ method: "GET" })
  .validator((input: unknown) => suggestSchema.parse(input))
  .handler(async ({ data }) => suggestPlan(PROTOTYPE_CLIENT_SLUG, data.year));
