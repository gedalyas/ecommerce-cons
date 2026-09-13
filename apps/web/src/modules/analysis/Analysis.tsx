import { useNavigate, useSearch } from "@tanstack/react-router";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { PageHeader } from "@/shared/ui/PageHeader";
import { PeriodSelector } from "@/shared/ui/PeriodSelector";
import { SectionBlock } from "@/shared/ui/SectionBlock";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/Select";
import { TimeSeriesChart } from "@/shared/ui/TimeSeriesChart";
import { usePeriod } from "@/shared/hooks/usePeriod";
import { layout } from "@/shared/styles/spacing";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { formatPeriodLabel, formatVariation } from "@/shared/utils/format";
import { formatMetric } from "@/shared/utils/metricFormat";
import type { PeriodSearch } from "@/shared/utils/period";
import {
  analysisMetricKeys,
  type AnalysisMetricKey,
  type AnalysisScreen,
  type DriverReading,
  type Verdict,
} from "./analysis.types";
import type { AnalysisSearch } from "./analysisSchema";
import { metricDefinitions } from "./driverTrees";

const verdictLabel: Record<Verdict, string> = {
  positivo: "Positivo",
  neutro: "Neutro",
  negativo: "Negativo",
};

const verdictTone: Record<Verdict, "accent" | "muted" | "warning"> = {
  positivo: "accent",
  neutro: "muted",
  negativo: "warning",
};

const deltaTone = (d: DriverReading) => {
  const v = d.metric.variation;
  if (v == null || Math.abs(v) < 2) return "text-muted-foreground";
  return v > 0 === (d.goodWhen === "up") ? "text-primary" : "text-warning";
};

function DriverTile({ driver }: { driver: DriverReading }) {
  return (
    <Card className={layout.cardPadding}>
      <p className={cn(textClass.label, "text-muted-foreground")}>{driver.label}</p>
      <p className={cn(textClass.cardTitle, textClass.numeric, "mt-2")}>
        {formatMetric(driver.metric.value, driver.unit)}
      </p>
      <p className={cn(textClass.meta, textClass.numeric, "mt-1", deltaTone(driver))}>
        {driver.metric.variation == null
          ? "sem comparação"
          : `${formatVariation(driver.metric.variation)} · antes ${formatMetric(driver.metric.previous, driver.unit)}`}
      </p>
    </Card>
  );
}

function useAnalysisSearch() {
  const search = useSearch({ from: "/metricas" }) as PeriodSearch & AnalysisSearch;
  const navigate = useNavigate();
  const setMetric = (metrica: AnalysisMetricKey) =>
    void navigate({
      to: "/metricas",
      search: (prev: Record<string, unknown>) => ({ ...prev, metrica }),
      replace: true,
    });
  return { search, setMetric };
}

export function Analysis({ data }: { data: AnalysisScreen }) {
  const { period, setPeriod } = usePeriod();
  const { search, setMetric } = useAnalysisSearch();
  const { narrative } = data;

  return (
    <div className={layout.page}>
      <PageHeader
        title="Métricas"
        subtitle={`Diagnóstico de ${data.metric.label} em ${formatPeriodLabel(period.inicio, period.fim)} · Loja Aurora`}
      />

      <div className={cn(layout.headerGap, layout.blockStack)}>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={search.metrica} onValueChange={(v) => setMetric(v as AnalysisMetricKey)}>
            <SelectTrigger className="w-64" aria-label="Métrica">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {analysisMetricKeys.map((key) => (
                <SelectItem key={key} value={key}>
                  {metricDefinitions[key].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <PeriodSelector value={period} onChange={setPeriod} />
          <Button variant="outline" className="ml-auto" onClick={() => window.print()}>
            Baixar PDF
          </Button>
        </div>

        <p className={cn(textClass.meta, "text-muted-foreground")}>
          Período analisado: {formatPeriodLabel(period.inicio, period.fim)}
          {data.comparison
            ? ` · Comparado com ${formatPeriodLabel(data.comparison.inicio, data.comparison.fim)}`
            : " · Sem comparação"}
        </p>

        <SectionBlock
          title={narrative.title}
          meta={
            <span className="flex items-center gap-2">
              <Badge tone={verdictTone[narrative.verdict]}>{verdictLabel[narrative.verdict]}</Badge>
              <Badge tone="outline">
                {narrative.benchmark
                  ? `Benchmark ${narrative.benchmark.label}`
                  : "Benchmark indisponível"}
              </Badge>
            </span>
          }
          bodyClassName={layout.cardPadding}
        >
          <p className={textClass.body}>{narrative.diagnosis}</p>
          <p className={cn(textClass.body, "mt-3")}>{narrative.levers}</p>
          <p className={cn(textClass.meta, "mt-4 text-muted-foreground")}>
            Texto gerado por regras a partir da árvore de drivers calculada nos dois períodos. Com
            uma chave de IA configurada, a mesma árvore vira uma narrativa em linguagem natural.
          </p>
        </SectionBlock>

        <SectionBlock
          title={data.metric.label.toUpperCase()}
          meta={
            <span className={cn(textClass.meta, textClass.numeric, "text-muted-foreground")}>
              {data.headline.variation == null
                ? "sem comparação"
                : `${formatVariation(data.headline.variation)} vs período comparado`}
            </span>
          }
          bodyClassName={layout.cardPadding}
        >
          <p className={cn(textClass.kpi, textClass.numeric)}>
            {formatMetric(data.headline.value, data.metric.unit)}
          </p>
          <p className={cn(textClass.meta, "mt-4 text-muted-foreground")}>
            Linha sólida é a sua loja. Linha tracejada é o período comparado.
          </p>
          <TimeSeriesChart
            className="mt-4"
            series={data.series}
            unit={data.metric.unit}
            granularity={period.por}
            currentLabel={data.metric.label}
            previousLabel="Período comparado"
          />
        </SectionBlock>

        <SectionBlock
          title={data.metric.section === "drove" ? "O que impulsionou isso" : "Sinais relacionados"}
          description="Cada driver nos dois períodos; verde quando se moveu na direção boa para a métrica."
          bodyClassName={layout.cardPadding}
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.drivers.map((driver) => (
              <DriverTile key={driver.key} driver={driver} />
            ))}
          </div>
        </SectionBlock>
      </div>
    </div>
  );
}
