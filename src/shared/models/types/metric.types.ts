/**
 * Shapes every analytics query returns. Scalars travel as objects (value +
 * unit + variation), never as bare numbers, and every payload carries its
 * comparison period so screens only render the difference.
 */
export type MetricUnit = "currency" | "count" | "percent" | "multiplier" | "days";

export type MetricValue = {
  value: number | null;
  unit: MetricUnit;
  /** Same metric in the comparison window; null when comparison is off. */
  previous: number | null;
  /** Percent change vs. previous, in percentage points of change (8.2 = +8,2%). */
  variation: number | null;
};

export type Envelope<T> = { current: T; previous: T | null };

/** One bucket of a time series; `bucket` is the ISO date the bucket starts on. */
export type SeriesPoint = { bucket: string; value: number };

export type Series = Envelope<SeriesPoint[]>;

export type BreakdownSlice = { key: string; label: string; value: number; share: number };
