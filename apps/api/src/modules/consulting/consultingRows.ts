import type { DeltaDirection, Fidelity, PillarStatus } from "@ecommerce/database/enums";
import type {
  ConsultingMetric,
  ConsultingPillar,
  ConsultingRecommendation,
  ConsultingSection,
  MilestoneCriterion,
  MilestoneSummary,
  PillarStatusKey,
} from "@ecommerce/contracts/consulting";

export type MetricRow = {
  label: string;
  value: string;
  delta: string | null;
  deltaDirection: DeltaDirection | null;
  subNote: string | null;
  fidelity: Fidelity;
  fidelityNote: string;
};

export type RecommendationRow = { text: string; dueLabel: string; owner: string };

export type PillarRow = {
  title: string;
  status: PillarStatus;
  dataPending: string | null;
  extra: string | null;
  metrics: MetricRow[];
  recommendations: RecommendationRow[];
};

export type SectionRow = { title: string; subtitle: string; pillars: PillarRow[] };

export const pillarStatusKey: Record<PillarStatus, PillarStatusKey> = {
  DONE: "done",
  IN_PROGRESS: "in-progress",
  NOT_STARTED: "not-started",
  BLOCKED: "blocked",
};

const deltaDirectionKey: Record<DeltaDirection, NonNullable<ConsultingMetric["deltaDirection"]>> = {
  UP: "up",
  DOWN: "down",
  NEUTRAL: "neutral",
};

export function toMetric(row: MetricRow): ConsultingMetric {
  return {
    label: row.label,
    value: row.value,
    fidelity: row.fidelity,
    fidelityNote: row.fidelityNote,
    ...(row.delta ? { delta: row.delta } : {}),
    ...(row.deltaDirection ? { deltaDirection: deltaDirectionKey[row.deltaDirection] } : {}),
    ...(row.subNote ? { subNote: row.subNote } : {}),
  };
}

export function toRecommendation(row: RecommendationRow): ConsultingRecommendation {
  return { text: row.text, dueDate: row.dueLabel, owner: row.owner };
}

export function toPillar(row: PillarRow): ConsultingPillar {
  return {
    title: row.title,
    status: pillarStatusKey[row.status],
    kpis: row.metrics.map(toMetric),
    recommendations: row.recommendations.map(toRecommendation),
    ...(row.dataPending ? { dataPending: row.dataPending } : {}),
    ...(row.extra ? { extra: row.extra } : {}),
  };
}

export function toSection(row: SectionRow): ConsultingSection {
  return { title: row.title, subtitle: row.subtitle, pillars: row.pillars.map(toPillar) };
}

export function milestoneSummaryOf(criteria: MilestoneCriterion[]): MilestoneSummary {
  return { achieved: criteria.filter((c) => c.achieved).length, total: criteria.length };
}
