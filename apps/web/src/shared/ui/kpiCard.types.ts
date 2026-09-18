import type { MetricValue } from "@ecommerce/contracts/shared/metric.types";

export type KpiCardProps = {
  label: string;
  metric: MetricValue;
  /** Text after the variation, e.g. "vs período anterior". */
  comparisonLabel?: string;
  /** Whether an increase is good news (default) or bad (CAC, CPA, cancelamentos). */
  goodWhen?: "up" | "down";
  className?: string;
};
