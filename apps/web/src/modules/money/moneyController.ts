import { createServerFn } from "@tanstack/react-start";
import {
  costIdSchema,
  costInputSchema,
  costUpdateSchema,
  moneySearchSchema,
  type CostRuleRow,
  type MoneyScreen,
} from "@ecommerce/contracts/money";
import { parsePeriodSearch, type PeriodSearch } from "@ecommerce/contracts/shared/period";
import { apiFetch } from "@/shared/dependencies/apiClient";

export const getMoneyScreen = createServerFn({ method: "GET" })
  .validator((input: Partial<PeriodSearch> & Record<string, unknown>) => ({
    ...parsePeriodSearch(input),
    ...moneySearchSchema.parse(input),
  }))
  .handler(async ({ data }) => apiFetch<MoneyScreen>("/money", { query: data }));

export const createCostRule = createServerFn({ method: "POST" })
  .validator((input: unknown) => costInputSchema.parse(input))
  .handler(async ({ data }) =>
    apiFetch<CostRuleRow>("/money/costs", { method: "POST", body: data }),
  );

export const updateCostRule = createServerFn({ method: "POST" })
  .validator((input: unknown) => costUpdateSchema.parse(input))
  .handler(async ({ data }) =>
    apiFetch<CostRuleRow>(`/money/costs/${encodeURIComponent(data.id)}`, {
      method: "PUT",
      body: data.input,
    }),
  );

export const deleteCostRule = createServerFn({ method: "POST" })
  .validator((input: unknown) => costIdSchema.parse(input))
  .handler(async ({ data }) =>
    apiFetch<void>(`/money/costs/${encodeURIComponent(data.id)}`, { method: "DELETE" }),
  );
