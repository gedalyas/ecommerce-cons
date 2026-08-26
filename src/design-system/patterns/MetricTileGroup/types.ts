import type { Metric, MetricTileAction } from "../MetricTile/types";

export type MetricTileGroupProps = {
  metrics: Metric[];
  className?: string;
  /** Sem borda/fundo próprios (quando já está dentro de outro card). */
  bare?: boolean;
  actions?: Record<string, MetricTileAction>;
};
