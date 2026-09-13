import { createServerFn } from "@tanstack/react-start";
import { analysisSearchSchema, type AnalysisScreen } from "@ecommerce/contracts/analysis";
import { parsePeriodSearch, type PeriodSearch } from "@ecommerce/contracts/shared/period";
import { apiFetch } from "@/shared/dependencies/apiClient";

export const getAnalysisScreen = createServerFn({ method: "GET" })
  .validator((input: Partial<PeriodSearch> & Record<string, unknown>) => ({
    ...parsePeriodSearch(input),
    ...analysisSearchSchema.parse(input),
  }))
  .handler(async ({ data }) => apiFetch<AnalysisScreen>("/analysis", { query: data }));
