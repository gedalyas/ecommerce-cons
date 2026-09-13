import type { MetricValue } from "@/lib/metrics";
import type { Fidelity } from "../FidelityBadge/types";

export type KpiCardProps = {
  label: string;
  metric: MetricValue;
  fidelity?: Fidelity;
  fidelityNote?: string;
  /** Text after the variation, e.g. "vs período anterior". */
  comparisonLabel?: string;
  /** Whether an increase is good news (default) or bad (CAC, CPA, cancelamentos). */
  goodWhen?: "up" | "down";
  className?: string;
};
