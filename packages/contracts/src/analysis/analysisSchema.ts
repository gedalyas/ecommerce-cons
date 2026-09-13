import { z } from "zod";
import { analysisMetricKeys } from "./analysis.types";

export const analysisSearchSchema = z.object({
  metrica: z.enum(analysisMetricKeys).catch("totalSold"),
});

export type AnalysisSearch = z.infer<typeof analysisSearchSchema>;
export const defaultAnalysisSearch: AnalysisSearch = analysisSearchSchema.parse({});
