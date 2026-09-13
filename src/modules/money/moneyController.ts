/**
 * Dinheiro server functions: validate the input, call the service, return
 * the typed payload. Writes go through POST and the CSRF middleware.
 */
import { createServerFn } from "@tanstack/react-start";
import { PROTOTYPE_CLIENT_SLUG } from "@/shared/config/prototype";
import { parsePeriodSearch, type PeriodSearch } from "@/shared/utils/period";
import {
  costIdSchema,
  costInputSchema,
  costUpdateSchema,
  moneySearchSchema,
  type MoneySearch,
} from "./moneySchema";
import { createCost, deleteCost, moneyScreen, updateCost } from "./moneyService";

export const getMoneyScreen = createServerFn({ method: "GET" })
  .validator((input: Partial<PeriodSearch & MoneySearch>) => ({
    ...parsePeriodSearch(input),
    ...moneySearchSchema.parse(input),
  }))
  .handler(async ({ data }) => moneyScreen(PROTOTYPE_CLIENT_SLUG, data));

export const createCostRule = createServerFn({ method: "POST" })
  .validator((input: unknown) => costInputSchema.parse(input))
  .handler(async ({ data }) => createCost(PROTOTYPE_CLIENT_SLUG, data));

export const updateCostRule = createServerFn({ method: "POST" })
  .validator((input: unknown) => costUpdateSchema.parse(input))
  .handler(async ({ data }) => updateCost(PROTOTYPE_CLIENT_SLUG, data.id, data.input));

export const deleteCostRule = createServerFn({ method: "POST" })
  .validator((input: unknown) => costIdSchema.parse(input))
  .handler(async ({ data }) => deleteCost(PROTOTYPE_CLIENT_SLUG, data.id));
