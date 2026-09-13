import { DataTable, type DataTableColumn } from "@/shared/ui/DataTable";
import { DonutBreakdown } from "@/shared/ui/DonutBreakdown";
import { SectionBlock } from "@/shared/ui/SectionBlock";
import { TimeSeriesChart } from "@/shared/ui/TimeSeriesChart";
import { layout } from "@/shared/styles/spacing";
import { formatCurrency, formatNumber, formatPercent } from "@ecommerce/contracts/shared/format";
import type { PeriodSearch } from "@ecommerce/contracts/shared/period";
import type {
  ApprovalRow,
  OrdersApproval as OrdersApprovalData,
  OrdersFilterOptions,
  OrdersSearch,
} from "@ecommerce/contracts/orders";
import { OrdersFilters } from "./OrdersFilters";

const round2 = (v: number | null) => (v == null ? null : Math.round(v * 100) / 100);

const columns: DataTableColumn<ApprovalRow>[] = [
  { key: "label", header: "Valor", render: (r) => r.label, sortValue: (r) => r.label },
  {
    key: "captured",
    header: "Total capturado",
    align: "right",
    render: (r) => formatCurrency(r.captured),
    csv: (r) => round2(r.captured),
    sortValue: (r) => r.captured,
  },
  {
    key: "paid",
    header: "Total pago",
    align: "right",
    render: (r) => formatCurrency(r.paid),
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
    key: "orders",
    header: "Pedidos",
    align: "right",
    render: (r) => formatNumber(r.orders),
    csv: (r) => r.orders,
    sortValue: (r) => r.orders,
  },
  {
    key: "paidOrders",
    header: "Pedidos pagos",
    align: "right",
    render: (r) => formatNumber(r.paidOrders),
    csv: (r) => r.paidOrders,
    sortValue: (r) => r.paidOrders,
  },
];

/** Where revenue gets stuck: status, method and gateway of payment, each as share + table. */
export function OrdersApproval({
  data,
  options,
  search,
  period,
  onPatch,
}: {
  data: OrdersApprovalData;
  options: OrdersFilterOptions;
  search: OrdersSearch;
  period: PeriodSearch;
  onPatch: (next: Partial<OrdersSearch>) => void;
}) {
  return (
    <>
      <OrdersFilters
        options={options}
        search={search}
        onPatch={onPatch}
        keys={["status", "gateway", "metodo"]}
      />

      <SectionBlock
        title="Taxa de aprovação ao longo do tempo"
        description="Receita paga sobre receita capturada em cada bucket do período."
        bodyClassName={layout.cardPadding}
      >
        <TimeSeriesChart
          series={data.approvalSeries}
          unit="percent"
          granularity={period.por}
          height="sm"
        />
      </SectionBlock>

      {data.dimensions.map((dimension) => (
        <SectionBlock
          key={dimension.key}
          title={dimension.label}
          description="Participação no total capturado e quanto de cada fatia foi efetivamente pago."
        >
          <div className={layout.cardPadding}>
            <DonutBreakdown slices={dimension.slices} unit="currency" totalLabel="capturado" />
          </div>
          <DataTable
            columns={columns}
            rows={dimension.rows}
            rowKey={(r) => r.key}
            initialSort={{ key: "captured", direction: "desc" }}
            csvFileName={`pedidos-aprovacao-${dimension.key}-${period.inicio}-${period.fim}`}
          />
        </SectionBlock>
      ))}
    </>
  );
}
