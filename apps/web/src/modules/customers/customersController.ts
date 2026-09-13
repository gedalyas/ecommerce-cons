import { createServerFn } from "@tanstack/react-start";
import {
  customersSearchSchema,
  type RfmCustomerRow,
  type CustomersScreen,
  type RetentionSummary,
} from "@ecommerce/contracts/customers";
import { parsePeriodSearch, type PeriodSearch } from "@ecommerce/contracts/shared/period";
import { apiFetch } from "@/shared/dependencies/apiClient";

const parseInput = (input: Partial<PeriodSearch> & Record<string, unknown>) => ({
  ...parsePeriodSearch(input),
  ...customersSearchSchema.parse(input),
});

export const getCustomersScreen = createServerFn({ method: "GET" })
  .validator(parseInput)
  .handler(async ({ data }) => apiFetch<CustomersScreen>("/customers", { query: data }));

export const getCustomersExport = createServerFn({ method: "GET" })
  .validator(parseInput)
  .handler(async ({ data }) => apiFetch<RfmCustomerRow[]>("/customers/export", { query: data }));

export const refreshCustomerSegments = createServerFn({ method: "POST" }).handler(async () => {
  const { updated } = await apiFetch<{ updated: number }>("/customers/segments/refresh", {
    method: "POST",
  });
  return updated;
});

export const getRetentionSummary = createServerFn({ method: "GET" }).handler(async () =>
  apiFetch<RetentionSummary>("/customers/retention"),
);
