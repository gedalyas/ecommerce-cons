import { createServerFn } from "@tanstack/react-start";
import type { DashboardOverview } from "@ecommerce/contracts/dashboard";
import { parsePeriodSearch, type PeriodSearch } from "@ecommerce/contracts/shared/period";
import { apiFetch } from "@/shared/dependencies/apiClient";

export const getDashboardOverview = createServerFn({ method: "GET" })
  .validator((input: PeriodSearch) => parsePeriodSearch(input))
  .handler(async ({ data }) => apiFetch<DashboardOverview>("/dashboard", { query: data }));
