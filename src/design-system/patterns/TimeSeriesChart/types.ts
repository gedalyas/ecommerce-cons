import type { MetricUnit, Series } from "@/lib/metrics";
import type { Granularity } from "@/lib/period";

export type TimeSeriesChartProps = {
  series: Series;
  unit: MetricUnit;
  granularity: Granularity;
  /** Legend labels. */
  currentLabel?: string;
  previousLabel?: string;
  height?: "sm" | "md";
  className?: string;
};
