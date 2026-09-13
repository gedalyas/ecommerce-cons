import type { RfmScores } from "./customers.types";

/**
 * Segment labels tuned for a store where most buyers have a single order:
 * three paid orders already make a customer "loyal". Scores are 1–5 (5 best):
 * recency by quintile, frequency by thresholds, monetary by quintile.
 */
export const rfmSegmentLabels = [
  "Campeões",
  "Não pode perder",
  "Leais",
  "Potenciais leais",
  "Novos",
  "Promissores",
  "Precisam de atenção",
  "Em risco",
  "Perdidos",
  "Hibernando",
] as const;

export type RfmSegment = (typeof rfmSegmentLabels)[number];

export function segmentFor({ r, f, m }: RfmScores): RfmSegment {
  if (r >= 4 && f >= 3 && m >= 4) return "Campeões";
  if (r <= 2 && f >= 3) return "Não pode perder";
  if (f >= 3) return "Leais";
  if (r >= 4 && f === 2) return "Potenciais leais";
  if (r >= 4) return "Novos";
  if (r === 3 && f === 1) return "Promissores";
  if (r === 3) return "Precisam de atenção";
  if (f === 2) return "Em risco";
  if (r === 1) return "Perdidos";
  return "Hibernando";
}

/** Frequency score by paid orders: 1 → 1, 2 → 2, 3 → 3, 4 → 4, 5+ → 5. */
export const frequencyScore = (orders: number) => Math.max(1, Math.min(5, orders));

/**
 * Quintile scorer: returns 1–5 from a sorted sample of the population.
 * `higherIsBetter` false for recency (fewer days = better).
 */
export function quintileScorer(values: readonly number[], higherIsBetter: boolean) {
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 0) return () => 3;
  const cut = (q: number) =>
    sorted[Math.min(sorted.length - 1, Math.floor((sorted.length * q) / 5))]!;
  const cuts = [cut(1), cut(2), cut(3), cut(4)];
  return (value: number) => {
    let rank = 1;
    for (const c of cuts) if (value > c) rank += 1;
    return higherIsBetter ? rank : 6 - rank;
  };
}
