/**
 * Shapes every analytics query returns. Scalars travel as objects (value +
 * unit + variation), never as bare numbers, and every payload carries its
 * comparison period so screens only render the difference.
 */
import { formatCurrency, formatMultiplier, formatNumber, formatPercent } from "./format";

export type MetricUnit = "currency" | "count" | "percent" | "multiplier" | "days";

export type MetricValue = {
  value: number | null;
  unit: MetricUnit;
  /** Same metric in the comparison window; null when comparison is off. */
  previous: number | null;
  /** Percent change vs. previous, in percentage points of change (8.2 = +8,2%). */
  variation: number | null;
};

export type Envelope<T> = { current: T; previous: T | null };

/** One bucket of a time series; `bucket` is the ISO date the bucket starts on. */
export type SeriesPoint = { bucket: string; value: number };

export type Series = Envelope<SeriesPoint[]>;

export type BreakdownSlice = { key: string; label: string; value: number; share: number };

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
      return formatCurrency(value);
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
