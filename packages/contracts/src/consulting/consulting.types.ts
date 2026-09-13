import type { Fidelity } from "../shared/fidelity";
import type { MetricValue } from "../shared/metric.types";
import type { LiveKpiKey, SectionKey } from "./engagementTemplate";

export const pillarStatuses = ["done", "in-progress", "not-started", "blocked"] as const;
export type PillarStatusKey = (typeof pillarStatuses)[number];

export const pillarStatusLabel: Record<PillarStatusKey, string> = {
  done: "Concluído",
  "in-progress": "Em andamento",
  "not-started": "Não iniciado",
  blocked: "Bloqueado",
};

export type LiveKpi = {
  metric: MetricValue;
  goodWhen: "up" | "down";
  fidelity: Fidelity;
  fidelityNote: string;
  subNote?: string;
};

export type LiveKpiValues = Partial<Record<LiveKpiKey, LiveKpi>>;

export type ManualKpi = { value: string; delta: string | null; note: string; updatedAt: string };

export type ConsultingMetric =
  | { key: string; label: string; source: "live"; live: LiveKpi | null }
  | {
      key: string;
      label: string;
      source: "manual";
      hint: string;
      manual: ManualKpi | null;
      fidelity: Fidelity | null;
    };

export type ConsultingRecommendation = {
  id: string;
  pillarKey: string | null;
  text: string;
  dueDate: string;
  owner: string;
  doneAt: string | null;
};

export type ConsultingPillar = {
  key: string;
  title: string;
  status: PillarStatusKey;
  kpis: ConsultingMetric[];
  recommendations: ConsultingRecommendation[];
  dataPending?: string;
  extra?: string;
};

export type ConsultingSection = {
  key: SectionKey;
  title: string;
  subtitle: string;
  pillars: ConsultingPillar[];
  canEdit: boolean;
};

export type MilestoneCriterion = {
  key: string;
  name: string;
  hint: string;
  progress: number;
  achieved: boolean;
  note: string;
};

export type MilestoneSummary = { achieved: number; total: number };

export type ManualKpiValue = {
  pillarKey: string;
  kpiKey: string;
  value: string;
  delta: string | null;
  fidelity: Fidelity;
  note: string;
  updatedAt: string;
};
