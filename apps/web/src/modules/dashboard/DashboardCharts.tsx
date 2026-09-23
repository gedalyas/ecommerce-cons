import { useState } from "react";
import { BarBreakdownChart } from "@/shared/ui/BarBreakdownChart";
import { ComboChart } from "@/shared/ui/ComboChart";
import { DataTable, type DataTableColumn } from "@/shared/ui/DataTable";
import { DonutBreakdown } from "@/shared/ui/DonutBreakdown";
import { IndicatorCarousel } from "@/shared/ui/IndicatorCarousel";
import { MultiSeriesChart } from "@/shared/ui/MultiSeriesChart";
import { SectionBlock } from "@/shared/ui/SectionBlock";
import { TimeSeriesChart } from "@/shared/ui/TimeSeriesChart";
import { layout } from "@/shared/styles/spacing";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { formatPeriodLabel } from "@ecommerce/contracts/shared/format";
import { formatMetric } from "@ecommerce/contracts/shared/metricFormat";
import type { PeriodSearch } from "@ecommerce/contracts/shared/period";
import {
  dashboardWidgetCatalog,
  type DashboardMetricKey,
  type DashboardOverview,
  type DashboardTopProduct,
} from "@ecommerce/contracts/dashboard";

type ChartProps = { data: DashboardOverview; period: PeriodSearch };

const catalog = dashboardWidgetCatalog;

export function IndicatorWidget({ data, period }: ChartProps) {
  const [selected, setSelected] = useState<DashboardMetricKey>("totalSold");
  const indicator = data.metrics.find((m) => m.key === selected) ?? data.metrics[0]!;
  return (
    <SectionBlock
      title={catalog.indicator.label}
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
        <div className={cn(textClass.meta, "text-muted-foreground")}>{indicator.label}</div>
      </div>
      <TimeSeriesChart
        series={data.series[indicator.key]}
        unit={indicator.unit}
        granularity={period.por}
      />
    </SectionBlock>
  );
}

export function RevenueVsInvestmentWidget({ data, period }: ChartProps) {
  return (
    <SectionBlock
      title={catalog.revenueVsInvestment.label}
      description={catalog.revenueVsInvestment.description}
      bodyClassName={layout.cardPadding}
    >
      <ComboChart
        bars={{
          label: "Investimento em marketing",
          unit: "currency",
          points: data.series.marketingInvestment.current,
        }}
        line={{ label: "Total vendido", unit: "currency", points: data.series.totalSold.current }}
        granularity={period.por}
      />
    </SectionBlock>
  );
}

export function ChannelSplitWidget({ data, period }: ChartProps) {
  return (
    <SectionBlock
      title={catalog.channelSplit.label}
      description={catalog.channelSplit.description}
      bodyClassName={layout.cardPadding}
    >
      <MultiSeriesChart
        series={[
          {
            key: "ecommerce",
            label: "E-commerce",
            points: data.channelSplit.map((p) => ({ bucket: p.bucket, value: p.ecommerce })),
          },
          {
            key: "marketplace",
            label: "Marketplace",
            points: data.channelSplit.map((p) => ({ bucket: p.bucket, value: p.marketplace })),
          },
        ]}
        unit="currency"
        granularity={period.por}
      />
    </SectionBlock>
  );
}

export function BySourceWidget({ data }: ChartProps) {
  return (
    <SectionBlock
      title={catalog.bySource.label}
      description={catalog.bySource.description}
      bodyClassName={layout.cardPadding}
    >
      <DonutBreakdown slices={data.bySource} unit="currency" totalLabel="vendido" />
    </SectionBlock>
  );
}

const topProductColumns: DataTableColumn<DashboardTopProduct>[] = [
  { key: "name", header: "Produto", render: (r) => r.name, className: "font-semibold" },
  {
    key: "units",
    header: "Unidades",
    align: "right",
    render: (r) => formatMetric(r.units, "count"),
    className: "whitespace-nowrap",
  },
  {
    key: "revenue",
    header: "Receita",
    align: "right",
    render: (r) => formatMetric(r.revenue, "currency"),
    className: "whitespace-nowrap",
  },
];

export function TopProductsWidget({ data }: ChartProps) {
  return (
    <SectionBlock title={catalog.topProducts.label} description={catalog.topProducts.description}>
      <DataTable
        columns={topProductColumns}
        rows={data.topProducts}
        rowKey={(r) => r.productId}
        initialPageSize={10}
        pageSizeOptions={[10]}
        emptyMessage="Nenhuma venda no período."
      />
    </SectionBlock>
  );
}

export function CustomerMixWidget({ data }: ChartProps) {
  const { newCustomers, returningCustomers } = data.customerMix;
  const total = newCustomers + returningCustomers;
  const share = (value: number) => (total > 0 ? value / total : 0);
  return (
    <SectionBlock
      title={catalog.customerMix.label}
      description={catalog.customerMix.description}
      bodyClassName={layout.cardPadding}
    >
      <DonutBreakdown
        slices={[
          { key: "new", label: "Novos", value: newCustomers, share: share(newCustomers) },
          {
            key: "returning",
            label: "Recorrentes",
            value: returningCustomers,
            share: share(returningCustomers),
          },
        ].filter((s) => s.value > 0)}
        unit="count"
        totalLabel="clientes"
      />
    </SectionBlock>
  );
}

export function FunnelWidget({ data }: ChartProps) {
  const hasTraffic = data.funnel.some((s) => s.value > 0);
  return (
    <SectionBlock
      title={catalog.funnel.label}
      description={catalog.funnel.description}
      bodyClassName={layout.cardPadding}
    >
      <BarBreakdownChart
        items={hasTraffic ? data.funnel : []}
        unit="count"
        valueLabel="Quantidade"
      />
    </SectionBlock>
  );
}

export function PaidMediaWidget({ data, period }: ChartProps) {
  return (
    <SectionBlock
      title={catalog.paidMedia.label}
      description={catalog.paidMedia.description}
      bodyClassName={layout.cardPadding}
    >
      <ComboChart
        bars={{
          label: "Investimento",
          unit: "currency",
          points: data.paidMedia.map((p) => ({ bucket: p.bucket, value: p.spend })),
        }}
        line={{
          label: "Faturamento",
          unit: "currency",
          points: data.paidMedia.map((p) => ({ bucket: p.bucket, value: p.revenue })),
        }}
        granularity={period.por}
      />
    </SectionBlock>
  );
}
