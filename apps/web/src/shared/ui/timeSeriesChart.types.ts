import type { MetricUnit, Series } from "@/shared/models/types/metric.types";
import type { Granularity } from "@/shared/utils/period";

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
