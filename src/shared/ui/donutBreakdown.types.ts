import type { BreakdownSlice, MetricUnit } from "@/shared/models/types/metric.types";

export type DonutBreakdownProps = {
  slices: BreakdownSlice[];
  unit: MetricUnit;
  /** Text under the total in the middle of the ring. */
  totalLabel?: string;
  className?: string;
};
