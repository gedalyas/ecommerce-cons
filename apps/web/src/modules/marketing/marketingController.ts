import { createServerFn } from "@tanstack/react-start";
import { marketingSearchSchema, type MarketingScreen } from "@ecommerce/contracts/marketing";
import { parsePeriodSearch, type PeriodSearch } from "@ecommerce/contracts/shared/period";
import { apiFetch } from "@/shared/dependencies/apiClient";

export const getMarketingScreen = createServerFn({ method: "GET" })
  .validator((input: Partial<PeriodSearch> & Record<string, unknown>) => ({
    ...parsePeriodSearch(input),
    ...marketingSearchSchema.parse(input),
  }))
  .handler(async ({ data }) => apiFetch<MarketingScreen>("/marketing", { query: data }));
