export type MetricHint = { definition: string; formula: string };

export type Metric = {
  label: string;
  value: string;
  delta?: string;
  deltaDirection?: "up" | "down" | "neutral";
  deltaLabel?: string;
  subNote?: string;
  hint?: MetricHint | null;
};

export type MetricTileAction = { label: string; onClick?: () => void };

export type MetricTileProps = {
  metric: Metric;
  className?: string;
  action?: MetricTileAction | undefined;
};
