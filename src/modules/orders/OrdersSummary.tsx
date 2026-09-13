import { useState } from "react";
import { DataTable, type DataTableColumn } from "@/shared/ui/DataTable";
import { DonutBreakdown } from "@/shared/ui/DonutBreakdown";
import { IndicatorCarousel } from "@/shared/ui/IndicatorCarousel";
import { SectionBlock } from "@/shared/ui/SectionBlock";
import { TimeSeriesChart } from "@/shared/ui/TimeSeriesChart";
import { layout } from "@/shared/styles/spacing";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatPeriodLabel,
} from "@/shared/utils/format";
import { formatMetric } from "@/shared/utils/metricFormat";
import type { PeriodSearch } from "@/shared/utils/period";
import type {
  OrdersSourceRow,
  OrdersSummary as OrdersSummaryData,
  OrdersSummaryKey,
} from "./orders.types";

const money = (v: number | null) => (v == null ? "—" : formatCurrency(v));
const round2 = (v: number | null) => (v == null ? null : Math.round(v * 100) / 100);

const sourceColumns: DataTableColumn<OrdersSourceRow>[] = [
  { key: "channel", header: "Canal", render: (r) => r.channel, sortValue: (r) => r.channel },
  { key: "source", header: "Origem", render: (r) => r.source, sortValue: (r) => r.source },
  {
    key: "captured",
    header: "Total capturado",
    align: "right",
    render: (r) => money(r.captured),
    csv: (r) => round2(r.captured),
    sortValue: (r) => r.captured,
  },
  {
    key: "paid",
    header: "Total pago",
    align: "right",
    render: (r) => money(r.paid),
    csv: (r) => round2(r.paid),
    sortValue: (r) => r.paid,
  },
  {
    key: "approvalRate",
    header: "Taxa de aprovação",
    align: "right",
    render: (r) => (r.approvalRate == null ? "—" : formatPercent(r.approvalRate)),
    csv: (r) => round2(r.approvalRate),
    sortValue: (r) => r.approvalRate,
  },
  {
    key: "paidOrders",
    header: "Pedidos pagos",
    align: "right",
    render: (r) => formatNumber(r.paidOrders),
    csv: (r) => r.paidOrders,
    sortValue: (r) => r.paidOrders,
  },
  {
    key: "averageTicket",
    header: "Ticket médio",
    align: "right",
    render: (r) => money(r.averageTicket),
    csv: (r) => round2(r.averageTicket),
    sortValue: (r) => r.averageTicket,
  },
  {
    key: "items",
    header: "Itens vendidos",
    align: "right",
    render: (r) => formatNumber(r.items),
    csv: (r) => r.items,
    sortValue: (r) => r.items,
  },
  {
    key: "discounts",
    header: "Total de descontos",
    align: "right",
    render: (r) => money(r.discounts),
    csv: (r) => round2(r.discounts),
    sortValue: (r) => r.discounts,
  },
  {
    key: "discountPerOrder",
    header: "Desconto médio por pedido",
    align: "right",
    render: (r) => money(r.discountPerOrder),
    csv: (r) => round2(r.discountPerOrder),
    sortValue: (r) => r.discountPerOrder,
  },
];

export function OrdersSummary({ data, period }: { data: OrdersSummaryData; period: PeriodSearch }) {
  const [selected, setSelected] = useState<OrdersSummaryKey>("revenue");
  const indicator = data.metrics.find((m) => m.key === selected) ?? data.metrics[0]!;

  return (
    <>
      <SectionBlock
        title="Indicadores"
        meta={
          <span className={cn(textClass.meta, textClass.numeric, "text-muted-foreground")}>
            {formatPeriodLabel(period.inicio, period.fim)}
          </span>
        }
        bodyClassName={cn(layout.cardPadding, "space-y-6")}
      >
        <IndicatorCarousel
          items={data.metrics.map((m) => ({
            key: m.key,
            label: m.label,
            metric: m.metric,
            goodWhen: m.goodWhen,
          }))}
          selected={indicator.key}
          onSelect={(key) => setSelected(key as OrdersSummaryKey)}
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

      <SectionBlock
        title="De onde vêm as minhas vendas?"
        description="Receita paga por canal e origem de tráfego; a tabela abre a aprovação e o ticket de cada origem."
      >
        <div className={layout.cardPadding}>
          <DonutBreakdown slices={data.sourceSlices} unit="currency" totalLabel="pago" />
        </div>
        <DataTable
          columns={sourceColumns}
          rows={data.bySource}
          rowKey={(r) => `${r.channel}:${r.source}`}
          initialSort={{ key: "paid", direction: "desc" }}
          csvFileName={`pedidos-origem-${period.inicio}-${period.fim}`}
        />
      </SectionBlock>
    </>
  );
}
