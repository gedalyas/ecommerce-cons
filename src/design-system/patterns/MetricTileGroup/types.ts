import type { Metric, MetricTileAction } from "../MetricTile/types";

export type MetricTileGroupProps = {
  metrics: Metric[];
  className?: string;
  /** Drops its own border/background (when already nested in another card). */
  bare?: boolean;
  actions?: Record<string, MetricTileAction>;
};
