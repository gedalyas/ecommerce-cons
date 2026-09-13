/**
 * Turns the URL period into query windows and time buckets. All dates are
 * treated as UTC calendar days - the seeded facts are stored that way.
 */
import {
  resolveComparison,
  type DateRange,
  type Granularity,
  type PeriodSearch,
} from "@/shared/utils/period";

/** Half-open window: `start` inclusive, `end` exclusive. */
export type Window = { start: Date; end: Date };

const DAY = 86_400_000;

export function toWindow(range: DateRange): Window {
  return {
    start: new Date(`${range.inicio}T00:00:00.000Z`),
    end: new Date(new Date(`${range.fim}T00:00:00.000Z`).getTime() + DAY),
  };
}

export type ResolvedPeriod = {
  current: Window;
  previous: Window | null;
  por: Granularity;
};

export function resolvePeriod(search: PeriodSearch): ResolvedPeriod {
  const previous = resolveComparison(search);
  return {
    current: toWindow(search),
    previous: previous ? toWindow(previous) : null,
    por: search.por,
  };
}

/** Postgres `date_trunc` unit for a granularity. */
export const truncUnit: Record<Granularity, "day" | "week" | "month" | "year"> = {
  dia: "day",
  semana: "week",
  mes: "month",
  ano: "year",
};

function truncate(date: Date, por: Granularity): Date {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();
  switch (por) {
    case "dia":
      return new Date(Date.UTC(y, m, d));
    case "semana": {
      // ISO weeks start on Monday, matching Postgres date_trunc('week').
      const dow = (date.getUTCDay() + 6) % 7;
      return new Date(Date.UTC(y, m, d - dow));
    }
    case "mes":
      return new Date(Date.UTC(y, m, 1));
    case "ano":
      return new Date(Date.UTC(y, 0, 1));
  }
}

function step(date: Date, por: Granularity): Date {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();
  switch (por) {
    case "dia":
      return new Date(Date.UTC(y, m, d + 1));
    case "semana":
      return new Date(Date.UTC(y, m, d + 7));
    case "mes":
      return new Date(Date.UTC(y, m + 1, 1));
    case "ano":
      return new Date(Date.UTC(y + 1, 0, 1));
  }
}

export const isoDay = (date: Date) => date.toISOString().slice(0, 10);

/** Every bucket start (ISO date) covering the window, for zero-filling series. */
export function bucketsFor(window: Window, por: Granularity): string[] {
  const buckets: string[] = [];
  for (let b = truncate(window.start, por); b < window.end; b = step(b, por))
    buckets.push(isoDay(b));
  return buckets;
}

/**
 * Aligns raw `{ bucket, value }` rows to the full bucket list, filling gaps
 * with zero so charts never skip a day.
 */
export function fillSeries(
  window: Window,
  por: Granularity,
  rows: readonly { bucket: string; value: number }[],
): { bucket: string; value: number }[] {
  const byBucket = new Map(rows.map((r) => [r.bucket, r.value]));
  return bucketsFor(window, por).map((bucket) => ({ bucket, value: byBucket.get(bucket) ?? 0 }));
}

/** A bucket as a calendar window (ISO dates, `fim` inclusive), clipped to the period. */
export type BucketWindow = { bucket: string; inicio: string; fim: string };

/**
 * The buckets of a window with their own calendar bounds, so per-bucket
 * computations (costs prorated by day, for instance) see the days the bucket
 * actually covers inside the period.
 */
export function bucketWindows(window: Window, por: Granularity): BucketWindow[] {
  const lastDay = new Date(window.end.getTime() - DAY);
  const out: BucketWindow[] = [];
  for (let b = truncate(window.start, por); b < window.end; b = step(b, por)) {
    const start = b < window.start ? window.start : b;
    const next = new Date(step(b, por).getTime() - DAY);
    const end = next > lastDay ? lastDay : next;
    out.push({ bucket: isoDay(b), inicio: isoDay(start), fim: isoDay(end) });
  }
  return out;
}
