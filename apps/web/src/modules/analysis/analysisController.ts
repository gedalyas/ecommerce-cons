import { createServerFn } from "@tanstack/react-start";
import { PROTOTYPE_CLIENT_SLUG } from "@/shared/config/prototype";
import { parsePeriodSearch, type PeriodSearch } from "@/shared/utils/period";
import { analysisSearchSchema, type AnalysisSearch } from "./analysisSchema";
import { analysisScreen } from "./analysisService";

export const getAnalysisScreen = createServerFn({ method: "GET" })
  .validator((input: Partial<PeriodSearch & AnalysisSearch>) => ({
    ...parsePeriodSearch(input),
    ...analysisSearchSchema.parse(input),
  }))
  .handler(async ({ data }) => analysisScreen(PROTOTYPE_CLIENT_SLUG, data));
