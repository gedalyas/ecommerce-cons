import { formatMetric } from "@/shared/utils/metricFormat";
import { formatVariation } from "@/shared/utils/format";
import type { MetricValue } from "@ecommerce/contracts/shared/metric.types";
import type {
  AnalysisNarrative,
  Benchmark,
  DriverReading,
  MetricDefinition,
  Verdict,
} from "@ecommerce/contracts/analysis";

export const neutralBand = 2;

export function verdictOf(metric: MetricValue, goodWhen: "up" | "down"): Verdict {
  const v = metric.variation;
  if (v == null || Math.abs(v) < neutralBand) return "neutro";
  return v > 0 === (goodWhen === "up") ? "positivo" : "negativo";
}

const movement = (variation: number | null, goodWhen: "up" | "down") => {
  if (variation == null) return "ficou sem base de comparação";
  if (Math.abs(variation) < neutralBand) return "ficou estável";
  const verb = variation > 0 ? "subiu" : "caiu";
  const tone = variation > 0 === (goodWhen === "up") ? "" : " — na direção errada";
  return `${verb} ${formatVariation(Math.abs(variation), 1).replace("+", "")}${tone}`;
};

export function strongestDrivers(drivers: DriverReading[], limit = 2): DriverReading[] {
  return drivers
    .filter((d) => d.metric.variation != null && Math.abs(d.metric.variation) >= neutralBand)
    .sort((a, b) => Math.abs(b.metric.variation!) - Math.abs(a.metric.variation!))
    .slice(0, limit);
}

const driverSentence = (d: DriverReading) =>
  `${d.label} ${movement(d.metric.variation, d.goodWhen)} (${formatMetric(d.metric.previous, d.unit)} → ${formatMetric(d.metric.value, d.unit)})`;

export function titleOf(definition: MetricDefinition, headline: MetricValue): string {
  const v = headline.variation;
  if (v == null) return `${definition.label} em ${formatMetric(headline.value, definition.unit)}`;
  if (Math.abs(v) < neutralBand) return `${definition.label} estável no período`;
  const verb = v > 0 ? "cresceu" : "recuou";
  return `${definition.label} ${verb} ${formatVariation(Math.abs(v), 1).replace("+", "")} no período`;
}

export function diagnosisOf(
  definition: MetricDefinition,
  headline: MetricValue,
  drivers: DriverReading[],
  benchmark: Benchmark | null,
): string {
  const opening = `${definition.label} ${movement(headline.variation, definition.goodWhen)}, de ${formatMetric(headline.previous, definition.unit)} para ${formatMetric(headline.value, definition.unit)}.`;
  const strongest = strongestDrivers(drivers);
  const driverText =
    strongest.length === 0
      ? "Nenhum driver se moveu de forma relevante; a variação vem de efeitos pequenos e distribuídos."
      : `${definition.section === "drove" ? "O que mais pesou" : "Os sinais mais fortes"}: ${strongest.map(driverSentence).join("; ")}.`;
  const market =
    benchmark?.verdict == null
      ? "Sem referência de mercado para esta métrica."
      : `Contra o mercado (${benchmark.label}), a loja está ${benchmark.verdict} da faixa.`;
  return `${opening} ${driverText} ${market}`;
}

export function leversOf(definition: MetricDefinition, verdict: Verdict): string {
  const lead =
    verdict === "positivo"
      ? "Para sustentar o ganho:"
      : verdict === "negativo"
        ? "Alavancas para reverter:"
        : "Alavancas para destravar:";
  return `${lead} ${definition.levers.join("; ")}.`;
}

export function narrativeOf(
  definition: MetricDefinition,
  headline: MetricValue,
  drivers: DriverReading[],
  benchmark: Benchmark | null,
): AnalysisNarrative {
  const verdict = verdictOf(headline, definition.goodWhen);
  return {
    verdict,
    benchmark,
    title: titleOf(definition, headline),
    diagnosis: diagnosisOf(definition, headline, drivers, benchmark),
    levers: leversOf(definition, verdict),
  };
}
