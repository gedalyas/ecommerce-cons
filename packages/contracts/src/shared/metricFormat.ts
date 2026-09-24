import type { MetricUnit } from "./metric.types";
import {
  formatCurrency,
  formatDuration,
  formatMultiplier,
  formatNumber,
  formatPercent,
} from "./format";

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
    case "seconds":
      return formatDuration(value);
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
      return formatPercent(value, Math.abs(value) < 10 && !Number.isInteger(value) ? 1 : 0);
    case "multiplier":
      return formatMultiplier(value, 1);
    case "days":
    case "seconds":
      return formatNumber(value);
  }
}
