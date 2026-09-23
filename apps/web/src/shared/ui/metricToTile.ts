import type { Metric } from "./metricTile.types";
import { formatMetric } from "@ecommerce/contracts/shared/metricFormat";
import { formatVariation } from "@ecommerce/contracts/shared/format";
import type { KpiCardProps } from "./kpiCard.types";

export function metricToTile({
  label,
  metric,
  comparisonLabel = "vs período anterior",
  goodWhen = "up",
  hint = null,
}: KpiCardProps): Metric {
  const variation = metric.variation;
  const direction =
    variation == null || Math.abs(variation) < 0.05
      ? "neutral"
      : variation > 0 === (goodWhen === "up")
        ? "up"
        : "down";
  return {
    label,
    value: formatMetric(metric.value, metric.unit),
    ...(variation != null ? { delta: formatVariation(variation), deltaDirection: direction } : {}),
    deltaLabel: comparisonLabel,
    hint,
  };
}
