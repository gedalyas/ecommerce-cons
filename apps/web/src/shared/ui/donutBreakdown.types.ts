import type { BreakdownSlice, MetricUnit } from "@ecommerce/contracts/shared/metric.types";

export type DonutBreakdownProps = {
  slices: BreakdownSlice[];
  unit: MetricUnit;
  /** Text under the total in the middle of the ring. */
  totalLabel?: string;
  className?: string;
};
