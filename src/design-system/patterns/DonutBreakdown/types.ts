import type { BreakdownSlice, MetricUnit } from "@/lib/metrics";

export type DonutBreakdownProps = {
  slices: BreakdownSlice[];
  unit: MetricUnit;
  /** Text under the total in the middle of the ring. */
  totalLabel?: string;
  className?: string;
};
