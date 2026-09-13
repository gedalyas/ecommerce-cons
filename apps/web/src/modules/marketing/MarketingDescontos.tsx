import { DataTable, type DataTableColumn } from "@/shared/ui/DataTable";
import { DualSeriesChart } from "@/shared/ui/DualSeriesChart";
import { metricToTile } from "@/shared/ui/metricToTile";
import { MetricTileGroup } from "@/shared/ui/MetricTileGroup";
import { SectionBlock } from "@/shared/ui/SectionBlock";
import { layout } from "@/shared/styles/spacing";
import { formatCurrency, formatNumber, formatPercent } from "@/shared/utils/format";
import type { PeriodSearch } from "@/shared/utils/period";
import type {
  DiscountCodeRow,
  MarketingDiscounts as MarketingDiscountsData,
} from "./marketing.types";

const money = (v: number | null) => (v == null ? "—" : formatCurrency(v));
const pct = (v: number | null) => (v == null ? "—" : formatPercent(v));
const round2 = (v: number | null) => (v == null ? null : Math.round(v * 100) / 100);

const codeColumns: DataTableColumn<DiscountCodeRow>[] = [
  {
    key: "code",
    header: "Cupom",
    render: (r) => r.code,
    sortValue: (r) => r.code,
    className: "whitespace-nowrap font-semibold",
  },
  {
    key: "orders",
    header: "Pedidos",
    align: "right",
    render: (r) => formatNumber(r.orders),
    csv: (r) => r.orders,
    sortValue: (r) => r.orders,
  },
  {
    key: "firstOrders",
    header: "Primeiras compras",
    align: "right",
    render: (r) => formatNumber(r.firstOrders),
    csv: (r) => r.firstOrders,
    sortValue: (r) => r.firstOrders,
  },
  {
    key: "revenue",
    header: "Receita",
    align: "right",
    render: (r) => money(r.revenue),
    csv: (r) => round2(r.revenue),
    sortValue: (r) => r.revenue,
  },
  {
    key: "discounts",
    header: "Desconto concedido",
    align: "right",
    render: (r) => money(r.discounts),
    csv: (r) => round2(r.discounts),
    sortValue: (r) => r.discounts,
  },
  {
    key: "discountRate",
    header: "Desconto médio",
    align: "right",
    render: (r) => pct(r.discountRate),
    csv: (r) => round2(r.discountRate),
    sortValue: (r) => r.discountRate,
  },
  {
    key: "aov",
    header: "Ticket médio",
    align: "right",
    render: (r) => money(r.aov),
    csv: (r) => round2(r.aov),
    sortValue: (r) => r.aov,
  },
];

export function MarketingDescontos({
  data,
  period,
  comparisonLabel,
}: {
  data: MarketingDiscountsData;
  period: PeriodSearch;
  comparisonLabel: string;
}) {
  const tiles = data.metrics.map((m) =>
    metricToTile({
      label: m.label,
      metric: m.metric,
      comparisonLabel,
      goodWhen: m.goodWhen,
      fidelity: "A",
      fidelityNote: "Nível A — cupons e descontos registrados nos pedidos pagos.",
    }),
  );
  return (
    <>
      <MetricTileGroup metrics={tiles} />

      <SectionBlock
        title="Desconto concedido × receita com cupom"
        description="Quanto a loja abriu mão e quanto vendeu com cupom, por período."
        bodyClassName={layout.cardPadding}
      >
        <DualSeriesChart
          left={{ label: "Desconto concedido", unit: "currency", points: data.discountsSeries }}
          right={{ label: "Receita com cupom", unit: "currency", points: data.couponRevenueSeries }}
          granularity={period.por}
        />
      </SectionBlock>

      <SectionBlock
        title="Cupons"
        description="Cada cupom usado em pedidos pagos no período; primeiras compras mostram quantos clientes novos ele trouxe."
      >
        <DataTable
          columns={codeColumns}
          rows={data.codes}
          rowKey={(r) => r.code}
          initialSort={{ key: "revenue", direction: "desc" }}
          csvFileName={`marketing-cupons-${period.inicio}-${period.fim}`}
          emptyMessage="Nenhum cupom usado no período."
        />
      </SectionBlock>
    </>
  );
}
