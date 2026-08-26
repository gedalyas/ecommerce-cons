import type { Fidelity } from "../FidelityBadge/types";

export type Metric = {
  label: string;
  value: string;
  delta?: string;
  deltaDirection?: "up" | "down" | "neutral";
  subNote?: string;
  fidelity: Fidelity;
  fidelityNote: string;
};

export type MetricTileAction = { label: string; onClick?: () => void };

export type MetricTileProps = {
  metric: Metric;
  className?: string;
  /** Ação secundária opcional, alinhada à direita na linha do rótulo. */
  action?: MetricTileAction | undefined;
};
