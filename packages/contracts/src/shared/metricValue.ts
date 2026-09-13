import type { MetricUnit, MetricValue } from "./metric.types";

export function variationOf(current: number | null, previous: number | null) {
  if (current == null || previous == null || previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function metricValue(
  unit: MetricUnit,
  current: number | null,
  previous: number | null,
): MetricValue {
  return { value: current, unit, previous, variation: variationOf(current, previous) };
}
