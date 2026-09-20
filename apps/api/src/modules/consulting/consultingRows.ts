import {
  areaTemplateOf,
  type ConsultingMetric,
  type ConsultingPillar,
  type ConsultingRecommendation,
  type ConsultingSection,
  type LiveKpiValues,
  type MilestoneCriterion,
  type MilestoneSummary,
  type PillarKpiTemplate,
  type PillarStatusKey,
  type SectionKey,
  milestoneTemplate,
} from "@ecommerce/contracts/consulting";
import type { Fidelity, PillarStatus } from "@ecommerce/database/enums";

export type PillarRow = { key: string; status: PillarStatus; dataPending: string | null };

export type RecommendationRow = {
  id: string;
  pillarKey: string | null;
  text: string;
  dueDate: Date;
  owner: string;
  doneAt: Date | null;
};

export type ManualKpiRow = {
  pillarKey: string;
  kpiKey: string;
  value: string;
  delta: string | null;
  fidelity: Fidelity;
  note: string;
  updatedAt: Date;
};

export type MilestoneRow = { key: string; progress: number; achieved: boolean; note: string };

export const pillarStatusKey: Record<PillarStatus, PillarStatusKey> = {
  DONE: "done",
  IN_PROGRESS: "in-progress",
  NOT_STARTED: "not-started",
  BLOCKED: "blocked",
};

export const pillarStatusEnum: Record<PillarStatusKey, PillarStatus> = {
  done: "DONE",
  "in-progress": "IN_PROGRESS",
  "not-started": "NOT_STARTED",
  blocked: "BLOCKED",
};

export function toRecommendation(row: RecommendationRow): ConsultingRecommendation {
  return {
    id: row.id,
    pillarKey: row.pillarKey,
    text: row.text,
    dueDate: row.dueDate.toISOString().slice(0, 10),
    owner: row.owner,
    doneAt: row.doneAt?.toISOString() ?? null,
  };
}

function metricOf(
  pillarKey: string,
  kpi: PillarKpiTemplate,
  live: LiveKpiValues,
  manual: readonly ManualKpiRow[],
): ConsultingMetric {
  if (kpi.source === "live") {
    return { key: kpi.key, label: kpi.label, source: "live", live: live[kpi.live] ?? null };
  }
  const row = manual.find((m) => m.pillarKey === pillarKey && m.kpiKey === kpi.key);
  return {
    key: kpi.key,
    label: kpi.label,
    source: "manual",
    hint: kpi.hint,
    manual: row
      ? {
          value: row.value,
          delta: row.delta,
          note: row.note,
          updatedAt: row.updatedAt.toISOString(),
        }
      : null,
    fidelity: row?.fidelity ?? null,
  };
}

export type SectionInputs = {
  pillars: readonly PillarRow[];
  recommendations: readonly RecommendationRow[];
  manual: readonly ManualKpiRow[];
  live: LiveKpiValues;
  canEdit: boolean;
};

export function buildSection(key: SectionKey, inputs: SectionInputs): ConsultingSection {
  const area = areaTemplateOf(key);
  const pillars: ConsultingPillar[] = area.pillars.map((template) => {
    const row = inputs.pillars.find((p) => p.key === template.key);
    const status = row
      ? pillarStatusKey[row.status]
      : template.blockedByMilestone
        ? "blocked"
        : "not-started";
    return {
      key: template.key,
      title: template.title,
      status,
      kpis: template.kpis.map((kpi) => metricOf(template.key, kpi, inputs.live, inputs.manual)),
      recommendations: inputs.recommendations
        .filter((r) => r.pillarKey === template.key && !r.doneAt)
        .map(toRecommendation),
      ...(row?.dataPending ? { dataPending: row.dataPending } : {}),
    };
  });
  return { key, title: area.title, subtitle: area.subtitle, pillars, canEdit: inputs.canEdit };
}

export function toMilestone(rows: readonly MilestoneRow[]): MilestoneCriterion[] {
  return milestoneTemplate.map((template) => {
    const row = rows.find((r) => r.key === template.key);
    return {
      key: template.key,
      name: template.name,
      hint: template.hint,
      progress: row?.progress ?? 0,
      achieved: row?.achieved ?? false,
      note: row?.note ?? "",
    };
  });
}

export function milestoneSummaryOf(criteria: readonly MilestoneCriterion[]): MilestoneSummary {
  return { achieved: criteria.filter((c) => c.achieved).length, total: criteria.length };
}
