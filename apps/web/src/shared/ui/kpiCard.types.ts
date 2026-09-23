import type { MetricValue } from "@ecommerce/contracts/shared/metric.types";
import type { MetricHint } from "./metricTile.types";

export type KpiCardProps = {
  label: string;
  metric: MetricValue;
  comparisonLabel?: string;
  goodWhen?: "up" | "down";
  hint?: MetricHint | null;
  className?: string;
};
