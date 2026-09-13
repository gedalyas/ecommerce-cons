import type { MetricUnit, Series } from "@ecommerce/contracts/shared/metric.types";
import type { Granularity } from "@ecommerce/contracts/shared/period";

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
