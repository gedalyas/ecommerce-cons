export type Metric = {
  label: string;
  value: string;
  delta?: string;
  deltaDirection?: "up" | "down" | "neutral";
  /** Text after the delta, defaults to "vs mês anterior". */
  deltaLabel?: string;
  subNote?: string;
};

export type MetricTileAction = { label: string; onClick?: () => void };

export type MetricTileProps = {
  metric: Metric;
  className?: string;
  /** Optional secondary action, right-aligned on the label row. */
  action?: MetricTileAction | undefined;
};
