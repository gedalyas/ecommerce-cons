import { BarBreakdownChart } from "@/shared/ui/BarBreakdownChart";
import { DonutBreakdown } from "@/shared/ui/DonutBreakdown";
import { metricToTile } from "@/shared/ui/metricToTile";
import { MetricTileGroup } from "@/shared/ui/MetricTileGroup";
import { SectionBlock } from "@/shared/ui/SectionBlock";
import { TimeSeriesChart } from "@/shared/ui/TimeSeriesChart";
import { layout } from "@/shared/styles/spacing";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { formatNumber } from "@ecommerce/contracts/shared/format";
import type { PeriodSearch } from "@ecommerce/contracts/shared/period";
import type {
  CustomersRepurchase as CustomersRepurchaseData,
  RepurchaseMetric,
} from "@ecommerce/contracts/customers";

const tiles = (metrics: RepurchaseMetric[], comparisonLabel: string) =>
  metrics.map((m) =>
    metricToTile({
      label: m.question,
      metric: m.metric,
      comparisonLabel,
      goodWhen: m.goodWhen,
    }),
  );

/** Dependence on new acquisition vs. the recurring base, phrased as business questions. */
export function CustomersRepurchase({
  data,
  period,
  comparisonLabel,
}: {
  data: CustomersRepurchaseData;
  period: PeriodSearch;
  comparisonLabel: string;
}) {
  const intervals = data.byOrderNumber.filter((r) => r.orderNumber >= 2);
  return (
    <>
      <SectionBlock title="Receita" bodyClassName="p-0">
        <MetricTileGroup metrics={tiles(data.revenue, comparisonLabel)} bare />
      </SectionBlock>
      <SectionBlock title="Pedidos" bodyClassName="p-0">
        <MetricTileGroup metrics={tiles(data.orders, comparisonLabel)} bare />
      </SectionBlock>
      <SectionBlock title="Clientes" bodyClassName="p-0">
        <MetricTileGroup metrics={tiles(data.customers, comparisonLabel)} bare />
      </SectionBlock>

      <SectionBlock
        title="Intervalo entre compras"
        description="Dias, em média, entre o primeiro pedido e o pedido de número n dos clientes que o fizeram no período."
        bodyClassName={cn(layout.cardPadding, "grid gap-4 sm:grid-cols-3 lg:grid-cols-6")}
      >
        {intervals.map((r) => (
          <div key={r.orderNumber} className="min-w-0">
            <div className={cn(textClass.label, "text-muted-foreground")}>
              Até o {r.label} pedido
            </div>
            <div className={cn(textClass.kpi, textClass.numeric, "mt-1 text-foreground")}>
              {r.daysFromFirst == null ? "—" : `${formatNumber(r.daysFromFirst)} d`}
            </div>
            <div className={cn(textClass.meta, textClass.numeric, "text-muted-foreground")}>
              {formatNumber(r.orders)} pedidos
            </div>
          </div>
        ))}
      </SectionBlock>

      <SectionBlock title="Quanto eu vendi neste período?" bodyClassName={layout.cardPadding}>
        <TimeSeriesChart series={data.revenueSeries} unit="currency" granularity={period.por} />
      </SectionBlock>

      <SectionBlock
        title="Quanto do que eu vendi foi de compra vs. recompra?"
        bodyClassName={layout.cardPadding}
      >
        <DonutBreakdown slices={data.firstVsRepeat} unit="currency" totalLabel="vendido" />
      </SectionBlock>

      <SectionBlock
        title="Quanto eu vendi por ordem de compra do cliente?"
        description="Receita paga pelo número do pedido na vida do cliente (1º, 2º, …, 7º ou mais)."
        bodyClassName={layout.cardPadding}
      >
        <BarBreakdownChart
          items={data.byOrderNumber.map((r) => ({
            key: String(r.orderNumber),
            label: r.label,
            value: r.revenue,
          }))}
          unit="currency"
          valueLabel="Total vendido"
        />
      </SectionBlock>

      <SectionBlock
        title="Quanto é o ticket médio por ordem de compra?"
        bodyClassName={layout.cardPadding}
      >
        <BarBreakdownChart
          items={data.byOrderNumber.map((r) => ({
            key: String(r.orderNumber),
            label: r.label,
            value: r.averageTicket,
          }))}
          unit="currency"
          valueLabel="Ticket médio"
        />
      </SectionBlock>
    </>
  );
}
