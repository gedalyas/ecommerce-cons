import { createServerFn } from "@tanstack/react-start";
import type { ManagementScreen } from "@ecommerce/contracts/management";
import { parsePeriodSearch, type PeriodSearch } from "@ecommerce/contracts/shared/period";
import { apiFetch } from "@/shared/dependencies/apiClient";

export const getManagementScreen = createServerFn({ method: "GET" })
  .validator((input: Partial<PeriodSearch>) => parsePeriodSearch(input))
  .handler(async ({ data }) => apiFetch<ManagementScreen>("/management", { query: data }));
