import type {
  ConsultingMetric,
  ConsultingPillar,
  ConsultingRecommendation,
  ConsultingSection,
} from "@ecommerce/contracts/consulting";
import { formatDate } from "@ecommerce/contracts/shared/format";
import type { Metric } from "@/shared/ui/metricTile.types";
import { metricToTile } from "@/shared/ui/metricToTile";
import type { Pillar } from "@/shared/ui/pillarCard.types";
import type { Recommendation } from "@/shared/ui/recommendationList.types";
import type { Section } from "@/shared/ui/sectionPage.types";

const EMPTY_VALUE = "—";

export function metricTileOf(kpi: ConsultingMetric, comparisonLabel: string): Metric {
  if (kpi.source === "live") {
    if (!kpi.live || kpi.live.metric.value == null) {
      return {
        label: kpi.label,
        value: EMPTY_VALUE,
        subNote: "sem dados no período",
        fidelity: "C",
        fidelityNote: "Nível C — sem pedidos ou fontes suficientes no período para calcular.",
      };
    }
    const tile = metricToTile({
      label: kpi.label,
      metric: kpi.live.metric,
      comparisonLabel,
      goodWhen: kpi.live.goodWhen,
      fidelity: kpi.live.fidelity,
      fidelityNote: kpi.live.fidelityNote,
    });
    return kpi.live.subNote ? { ...tile, subNote: kpi.live.subNote } : tile;
  }
  if (!kpi.manual) {
    return {
      label: kpi.label,
      value: EMPTY_VALUE,
      subNote: kpi.hint,
      fidelity: "C",
      fidelityNote: "Nível C — indicador informado pela consultoria; ainda sem valor.",
    };
  }
  return {
    label: kpi.label,
    value: kpi.manual.value,
    ...(kpi.manual.delta ? { delta: kpi.manual.delta, deltaDirection: "neutral" } : {}),
    subNote: kpi.manual.note || kpi.hint,
    fidelity: kpi.fidelity ?? "B",
    fidelityNote: `Nível ${kpi.fidelity ?? "B"} — informado pela consultoria em ${formatDate(kpi.manual.updatedAt)}.`,
  };
}

export function recommendationOf(r: ConsultingRecommendation): Recommendation {
  return { text: r.text, dueDate: `até ${formatDate(`${r.dueDate}T00:00:00`)}`, owner: r.owner };
}

export function pillarOf(pillar: ConsultingPillar, comparisonLabel: string): Pillar {
  return {
    key: pillar.key,
    title: pillar.title,
    status: pillar.status,
    kpis: pillar.kpis.map((kpi) => metricTileOf(kpi, comparisonLabel)),
    recommendations: pillar.recommendations.map(recommendationOf),
    ...(pillar.dataPending ? { dataPending: pillar.dataPending } : {}),
    ...(pillar.extra ? { extra: pillar.extra } : {}),
  };
}

export function sectionOf(section: ConsultingSection, comparisonLabel: string): Section {
  return {
    title: section.title,
    subtitle: section.subtitle,
    pillars: section.pillars.map((p) => pillarOf(p, comparisonLabel)),
  };
}
