import { useState } from "react";
import { DataTable, type DataTableColumn } from "@/design-system/patterns/DataTable";
import { DonutBreakdown } from "@/design-system/patterns/DonutBreakdown";
import { IndicatorCarousel } from "@/design-system/patterns/IndicatorCarousel";
import { metricToTile } from "@/design-system/patterns/KpiCard";
import { MetricTileGroup } from "@/design-system/patterns/MetricTileGroup";
import { PageHeader } from "@/design-system/patterns/PageHeader";
import { PeriodSelector } from "@/design-system/patterns/PeriodSelector";
import { SectionBlock } from "@/design-system/patterns/SectionBlock";
import { TimeSeriesChart } from "@/design-system/patterns/TimeSeriesChart";
import { layout } from "@/design-system/tokens/spacing";
import { textClass } from "@/design-system/tokens/typography";
import { usePeriod } from "@/hooks/use-period";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate, formatNumber, formatPeriodLabel } from "@/lib/format";
import { formatMetric, type MetricUnit } from "@/lib/metrics";
import type { OrdersOverview } from "@/server/analytics/orders";

type SeriesKey = keyof OrdersOverview["series"];

const indicators: { key: SeriesKey; label: string; unit: MetricUnit }[] = [
  { key: "totalSold", label: "Total vendido", unit: "currency" },
  { key: "orders", label: "Pedidos", unit: "count" },
  { key: "averageTicket", label: "Ticket médio", unit: "currency" },
];

type BucketRow = { bucket: string; revenue: number; orders: number; ticket: number | null };

/**
 * Stage 0 proving ground: exercises the period selector, the comparison
 * envelope and every base pattern against the real database. Replaced by the
 * Pedidos screens in stage 2.
 */
export function OrdersDevPage({ data }: { data: OrdersOverview }) {
  const { period, setPeriod, comparison } = usePeriod();
  const [selected, setSelected] = useState<SeriesKey>("totalSold");
  const indicator = indicators.find((i) => i.key === selected) ?? indicators[0]!;

  const rows: BucketRow[] = data.series.totalSold.current.map((p, i) => {
    const orders = data.series.orders.current[i]?.value ?? 0;
    return {
      bucket: p.bucket,
      revenue: p.value,
      orders,
      ticket: orders > 0 ? p.value / orders : null,
    };
  });
  const totalRow: BucketRow = {
    bucket: "Total",
    revenue: data.metrics.totalSold.value ?? 0,
    orders: data.metrics.orders.value ?? 0,
    ticket: data.metrics.averageTicket.value,
  };

  const columns: DataTableColumn<BucketRow>[] = [
    {
      key: "bucket",
      header: "Período",
      render: (r) => (r.bucket === "Total" ? r.bucket : formatDate(`${r.bucket}T00:00:00`)),
      csv: (r) => r.bucket,
      sortValue: (r) => r.bucket,
    },
    {
      key: "orders",
      header: "Pedidos pagos",
      align: "right",
      render: (r) => formatNumber(r.orders),
      csv: (r) => r.orders,
      sortValue: (r) => r.orders,
    },
    {
      key: "revenue",
      header: "Total vendido",
      align: "right",
      render: (r) => formatCurrency(r.revenue),
      csv: (r) => Math.round(r.revenue * 100) / 100,
      sortValue: (r) => r.revenue,
    },
    {
      key: "ticket",
      header: "Ticket médio",
      align: "right",
      render: (r) => (r.ticket == null ? "—" : formatCurrency(r.ticket)),
      csv: (r) => (r.ticket == null ? null : Math.round(r.ticket * 100) / 100),
      sortValue: (r) => r.ticket,
    },
  ];

  const comparisonLabel = comparison
    ? `vs ${formatPeriodLabel(
        comparison.inicio,
        comparison.fim,
        comparison.inicio.slice(0, 4) !== period.inicio.slice(0, 4),
      )}`
    : "sem comparação";

  return (
    <div className={layout.page}>
      <PageHeader
        title="Pedidos por data"
        subtitle="Ambiente de validação da etapa 0 · Loja Aurora"
      />

      <div className={cn(layout.headerGap, layout.blockStack)}>
        <PeriodSelector value={period} onChange={setPeriod} />

        <MetricTileGroup
          metrics={[
            metricToTile({
              label: "Total vendido",
              metric: data.metrics.totalSold,
              comparisonLabel,
            }),
            metricToTile({ label: "Pedidos pagos", metric: data.metrics.orders, comparisonLabel }),
            metricToTile({
              label: "Ticket médio",
              metric: data.metrics.averageTicket,
              comparisonLabel,
            }),
            metricToTile({
              label: "Taxa de aprovação",
              metric: data.metrics.approvalRate,
              comparisonLabel,
              fidelity: "B",
              fidelityNote: "Nível B — receita paga sobre receita capturada no período.",
            }),
          ]}
        />

        <SectionBlock
          title="Resumo"
          meta={
            <span className={cn(textClass.meta, textClass.numeric, "text-muted-foreground")}>
              {formatPeriodLabel(period.inicio, period.fim)}
            </span>
          }
          bodyClassName={cn(layout.cardPadding, "space-y-6")}
        >
          <IndicatorCarousel
            items={indicators.map((i) => ({
              key: i.key,
              label: i.label,
              metric: data.metrics[i.key],
            }))}
            selected={selected}
            onSelect={(key) => setSelected(key as SeriesKey)}
          />
          <div>
            <div className={cn(textClass.kpi, textClass.numeric, "text-foreground")}>
              {formatMetric(data.metrics[indicator.key].value, indicator.unit)}
            </div>
            <div className={cn(textClass.meta, "text-muted-foreground")}>{indicator.label}</div>
          </div>
          <TimeSeriesChart
            series={data.series[indicator.key]}
            unit={indicator.unit}
            granularity={period.por}
          />
        </SectionBlock>

        <SectionBlock title="Vendas por status de pagamento" bodyClassName={layout.cardPadding}>
          <DonutBreakdown slices={data.byStatus} unit="currency" totalLabel="capturado" />
        </SectionBlock>

        <SectionBlock title="Pedidos por período">
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(r) => r.bucket}
            totalRow={totalRow}
            initialSort={{ key: "bucket", direction: "asc" }}
            csvFileName={`pedidos-${period.inicio}-${period.fim}`}
          />
        </SectionBlock>
      </div>
    </div>
  );
}
