import type { MetricValue } from "@/lib/metrics";

export type IndicatorItem = {
  key: string;
  label: string;
  metric: MetricValue;
  /** Whether an increase is good news (default) or bad. */
  goodWhen?: "up" | "down";
};

export type IndicatorCarouselProps = {
  items: IndicatorItem[];
  selected: string;
  onSelect: (key: string) => void;
  className?: string;
};
