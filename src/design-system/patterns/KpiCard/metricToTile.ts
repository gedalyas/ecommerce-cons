import type { Metric } from "../MetricTile/types";
import { formatMetric } from "@/lib/metrics";
import { formatVariation } from "@/lib/format";
import type { KpiCardProps } from "./types";

/**
 * Turns a computed MetricValue into the display shape MetricTile renders, so
 * query results and fixtures share one tile. Also used with MetricTileGroup.
 */
export function metricToTile({
  label,
  metric,
  fidelity = "A",
  fidelityNote = "Nível A — calculado sobre os pedidos importados.",
  comparisonLabel = "vs período anterior",
  goodWhen = "up",
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
    fidelity,
    fidelityNote,
  };
}
