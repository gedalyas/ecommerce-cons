/** Formatting and arithmetic over MetricValue; the shapes live in models/types/metric.types.ts. */
import { formatCurrency, formatMultiplier, formatNumber, formatPercent } from "./format";
import type { MetricUnit, MetricValue } from "@/shared/models/types/metric.types";

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

export function formatMetric(value: number | null, unit: MetricUnit) {
  if (value == null) return "—";
  switch (unit) {
    case "currency":
      return formatCurrency(value, Math.abs(value) < 10 ? 2 : 0);
    case "count":
      return formatNumber(value);
    case "percent":
      return formatPercent(value);
    case "multiplier":
      return formatMultiplier(value);
    case "days":
      return `${formatNumber(value, value < 10 ? 1 : 0)} dias`;
  }
}

/** Compact axis ticks: "12k", "1,2 mi", "18%", "3,1x". */
export function formatMetricCompact(value: number, unit: MetricUnit) {
  switch (unit) {
    case "currency":
      return value >= 1000
        ? `${formatNumber(value / 1000, value >= 100_000 ? 0 : 1)}k`
        : formatNumber(value);
    case "count":
      return value >= 1000 ? `${formatNumber(value / 1000, 1)}k` : formatNumber(value);
    case "percent":
      return formatPercent(value, 0);
    case "multiplier":
      return formatMultiplier(value, 1);
    case "days":
      return formatNumber(value);
  }
}
