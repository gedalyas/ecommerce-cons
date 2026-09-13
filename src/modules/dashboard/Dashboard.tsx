import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChannelToggle } from "@/shared/ui/ChannelToggle";
import { DataTable, type DataTableColumn } from "@/shared/ui/DataTable";
import { DonutBreakdown } from "@/shared/ui/DonutBreakdown";
import { IndicatorCarousel } from "@/shared/ui/IndicatorCarousel";
import { metricToTile } from "@/shared/ui/metricToTile";
import { MetricTileGroup } from "@/shared/ui/MetricTileGroup";
import { PageHeader } from "@/shared/ui/PageHeader";
import { PeriodSelector } from "@/shared/ui/PeriodSelector";
import { RecommendationList } from "@/shared/ui/RecommendationList";
import { SectionBlock } from "@/shared/ui/SectionBlock";
import { TimeSeriesChart } from "@/shared/ui/TimeSeriesChart";
import { usePeriod } from "@/shared/hooks/usePeriod";
import { layout } from "@/shared/styles/spacing";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { formatDate, formatPeriodLabel } from "@/shared/utils/format";
import { formatMetric } from "@/shared/utils/metricFormat";
import type { Granularity } from "@/shared/utils/period";
import type { DashboardMatrixRow, DashboardMetricKey, DashboardOverview } from "./dashboard.types";

const headlineKeys: DashboardMetricKey[] = [
  "totalSold",
  "contributionMargin",
  "cac",
  "repurchaseRate",
];
const headlineLabel: Partial<Record<DashboardMetricKey, string>> = { totalSold: "Faturamento" };

const bucketHeader = (bucket: string, por: Granularity) => {
  const date = `${bucket}T00:00:00`;
  switch (por) {
    case "dia":
      return formatDate(date);
    case "semana":
      return `sem. ${formatDate(date)}`;
    case "mes":
      return formatDate(date, { month: "short", year: "2-digit" });
    case "ano":
      return formatDate(date, { year: "numeric" });
  }
};

export function Dashboard({ data }: { data: DashboardOverview }) {
  const { period, setPeriod, comparison } = usePeriod();
  const [selected, setSelected] = useState<DashboardMetricKey>("totalSold");

  const byKey = new Map(data.metrics.map((m) => [m.key, m]));
  const indicator = byKey.get(selected) ?? data.metrics[0]!;
  const comparisonLabel = comparison
    ? `vs ${formatPeriodLabel(
        comparison.inicio,
        comparison.fim,
        comparison.inicio.slice(0, 4) !== period.inicio.slice(0, 4),
      )}`
    : "sem comparação";

  const headline = headlineKeys.flatMap((key) => {
    const m = byKey.get(key);
    return m
      ? [
          metricToTile({
            label: headlineLabel[key] ?? m.label,
            metric: m.metric,
            fidelity: m.fidelity,
            fidelityNote: m.fidelityNote,
            comparisonLabel,
            goodWhen: m.goodWhen,
          }),
        ]
      : [];
  });

  const matrixColumns: DataTableColumn<DashboardMatrixRow>[] = [
    {
      key: "metric",
      header: "Métrica",
      render: (r) => r.label,
      csv: (r) => r.label,
      className: "whitespace-nowrap font-semibold",
    },
    ...data.matrix.buckets.map((bucket, i) => ({
      key: bucket,
      header: bucketHeader(bucket, period.por),
      align: "right" as const,
      render: (r: DashboardMatrixRow) => formatMetric(r.values[i] ?? null, r.unit),
      csv: (r: DashboardMatrixRow) => {
        const v = r.values[i];
        return v == null ? null : Math.round(v * 100) / 100;
      },
      className: "whitespace-nowrap",
    })),
  ];

  return (
    <div className={layout.page}>
      <PageHeader
        title="Dashboard"
        subtitle={`Visão consolidada de ${formatPeriodLabel(period.inicio, period.fim)} · Loja Aurora`}
      />

      <div className={cn(layout.headerGap, layout.blockStack)}>
        <div className="flex flex-wrap items-center gap-2">
          <PeriodSelector value={period} onChange={setPeriod} />
          <ChannelToggle value={period.canal} onChange={(canal) => setPeriod({ canal })} />
        </div>

        <MetricTileGroup metrics={headline} />

        <SectionBlock
          title="Resumo do período"
          meta={
            <span className={cn(textClass.meta, textClass.numeric, "text-muted-foreground")}>
              {formatPeriodLabel(period.inicio, period.fim)}
            </span>
          }
          bodyClassName={cn(layout.cardPadding, "space-y-6")}
        >
          <IndicatorCarousel
            items={data.metrics
              .filter((m) => m.carousel)
              .map((m) => ({ key: m.key, label: m.label, metric: m.metric, goodWhen: m.goodWhen }))}
            selected={indicator.key}
            onSelect={(key) => setSelected(key as DashboardMetricKey)}
          />
          <div>
            <div className={cn(textClass.kpi, textClass.numeric, "text-foreground")}>
              {formatMetric(indicator.metric.value, indicator.unit)}
            </div>
            <div className={cn(textClass.meta, "text-muted-foreground")}>
              {indicator.label} · {indicator.fidelityNote}
            </div>
          </div>
          <TimeSeriesChart
            series={data.series[indicator.key]}
            unit={indicator.unit}
            granularity={period.por}
          />
        </SectionBlock>

        <SectionBlock
          title="Vendas por origem"
          description="Receita paga por origem e meio de tráfego (UTM); marketplaces aparecem pelo nome do canal."
          bodyClassName={layout.cardPadding}
        >
          <DonutBreakdown slices={data.bySource} unit="currency" totalLabel="vendido" />
        </SectionBlock>

        <SectionBlock
          title="Resumo financeiro"
          description="Cada métrica do período, aberta por bucket. Exporte em CSV para trabalhar fora do painel."
        >
          <DataTable
            columns={matrixColumns}
            rows={data.matrix.rows}
            rowKey={(r) => r.key}
            initialPageSize={20}
            pageSizeOptions={[20]}
            csvFileName={`resumo-financeiro-${period.inicio}-${period.fim}`}
          />
        </SectionBlock>

        <SectionBlock
          title="Precisa da sua atenção"
          tone="warning"
          description="Alertas derivados dos dados: últimos 7 dias contra os 7 anteriores, e o estoque no ritmo dos últimos 30."
          bodyClassName={layout.cardPaddingX}
        >
          {data.alerts.length === 0 ? (
            <p className={cn(textClass.body, "py-4 text-muted-foreground")}>
              Nenhum alerta no momento.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {data.alerts.map((alert) => (
                <li key={alert.title} className="group">
                  <Link
                    to={alert.to}
                    search={(prev: Record<string, unknown>) => ({ ...prev, ...alert.search })}
                    className="flex flex-wrap items-start gap-3 py-4 no-underline"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-semibold text-foreground">{alert.title}</div>
                      <p className={cn(textClass.meta, "mt-1 text-muted-foreground")}>
                        {alert.detail}
                      </p>
                    </div>
                    <span className="shrink-0 text-right text-[13px] text-muted-foreground transition-colors duration-150 group-hover:text-primary">
                      {alert.origin}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionBlock>

        <SectionBlock
          title="Marco de maturidade"
          tone="highlight"
          meta={
            <span className={cn(textClass.numeric, textClass.meta, "text-muted-foreground")}>
              {data.milestone.achieved} de {data.milestone.total} critérios
            </span>
          }
          description="Atingir os 4 critérios libera as áreas bloqueadas: Canais paralelos e Tecnologia."
          bodyClassName="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4"
        >
          {data.milestone.criteria.map((c) => (
            <div key={c.name} className="min-w-0 rounded-lg border border-border bg-card p-5">
              <div className="text-[15px] font-semibold leading-6 text-foreground">{c.name}</div>
              <div className="mt-3 h-1 w-full overflow-hidden rounded-sm bg-muted">
                <div
                  className={cn("h-full rounded-sm", c.achieved ? "bg-primary" : "bg-warning")}
                  style={{ width: `${c.progress}%` }}
                />
              </div>
              <div className={cn(textClass.meta, "mt-2 text-muted-foreground")}>
                <span className={cn("font-semibold", c.achieved ? "text-primary" : "text-warning")}>
                  {c.achieved ? "Atingido" : "Não atingido"}
                </span>
                {" · "}
                {c.note}
              </div>
            </div>
          ))}
        </SectionBlock>

        <SectionBlock title="Recomendações em aberto" bodyClassName={layout.cardPaddingX}>
          <RecommendationList items={data.recommendations} />
        </SectionBlock>
      </div>
    </div>
  );
}
