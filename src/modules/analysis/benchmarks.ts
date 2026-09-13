import { benchmarkVerdict, funnelRatios, roasBands } from "@/modules/marketing/contract";
import type { AnalysisMetricKey, Benchmark } from "./analysis.types";

const sessionsToPaid = funnelRatios.find((r) => r.key === "sessionsToPaid");

export function benchmarkFor(key: AnalysisMetricKey, value: number | null): Benchmark | null {
  switch (key) {
    case "conversionRate":
      return sessionsToPaid
        ? {
            label: `${sessionsToPaid.benchmark.min}% a ${sessionsToPaid.benchmark.max}%`,
            verdict: benchmarkVerdict(value, sessionsToPaid.benchmark),
          }
        : null;
    case "roas":
      return {
        label: `${roasBands.low}x a ${roasBands.high}x`,
        verdict: benchmarkVerdict(value, { min: roasBands.low, max: roasBands.high }),
      };
    default:
      return null;
  }
}
