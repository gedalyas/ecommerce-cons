import type { Fidelity } from "../shared/fidelity";

export const sectionKeys = ["money", "marketing", "logistics", "management"] as const;
export type SectionKey = (typeof sectionKeys)[number];

export const pillarStatuses = ["done", "in-progress", "not-started", "blocked"] as const;
export type PillarStatusKey = (typeof pillarStatuses)[number];

export type ConsultingMetric = {
  label: string;
  value: string;
  delta?: string;
  deltaDirection?: "up" | "down" | "neutral";
  deltaLabel?: string;
  subNote?: string;
  fidelity: Fidelity;
  fidelityNote: string;
};

export type ConsultingRecommendation = { text: string; dueDate: string; owner: string };

export type ConsultingPillar = {
  title: string;
  status: PillarStatusKey;
  kpis: ConsultingMetric[];
  recommendations: ConsultingRecommendation[];
  dataPending?: string;
  extra?: string;
};

export type ConsultingSection = { title: string; subtitle: string; pillars: ConsultingPillar[] };

export type MilestoneCriterion = {
  key: string;
  name: string;
  progress: number;
  achieved: boolean;
  note: string;
};

export type MilestoneSummary = { achieved: number; total: number };
