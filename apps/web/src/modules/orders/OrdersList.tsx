import { useServerFn } from "@tanstack/react-start";
import { DataTable, type DataTableColumn } from "@/shared/ui/DataTable";
import { SectionBlock } from "@/shared/ui/SectionBlock";
import { formatCurrency, formatDate, formatNumber, formatPercent } from "@/shared/utils/format";
import type { PeriodSearch } from "@ecommerce/contracts/shared/period";
import type {
  OrdersFilterOptions,
  OrdersListPage,
  OrdersListRow,
} from "@ecommerce/contracts/orders";
import { getOrdersExport } from "./ordersController";
import { OrdersFilters } from "./OrdersFilters";
import {
  ordersSortFields,
  type OrdersSearch,
  type OrdersSortField,
} from "@ecommerce/contracts/orders";

const round2 = (v: number | null) => (v == null ? null : Math.round(v * 100) / 100);
const money = (v: number | null) => (v == null ? "—" : formatCurrency(v, 2));

const columns: DataTableColumn<OrdersListRow>[] = [
  {
    key: "number",
    header: "Pedido",
    render: (r) => r.number,
    sortValue: (r) => r.number,
    className: "whitespace-nowrap font-semibold",
  },
  {
    key: "placedAt",
    header: "Data",
    render: (r) =>
      formatDate(r.placedAt, {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
    csv: (r) => r.placedAt,
    sortValue: (r) => r.placedAt,
    className: "whitespace-nowrap",
  },
  { key: "channel", header: "Canal", render: (r) => r.channel },
  { key: "source", header: "Origem", render: (r) => r.source, className: "whitespace-nowrap" },
  { key: "status", header: "Status", render: (r) => r.statusLabel, csv: (r) => r.statusLabel },
  {
    key: "customer",
    header: "Cliente",
    render: (r) => r.customerName,
    className: "whitespace-nowrap",
  },
  { key: "email", header: "E-mail", render: (r) => r.email },
  {
    key: "phone",
    header: "Telefone",
    render: (r) => r.phone ?? "—",
    csv: (r) => r.phone,
    className: "whitespace-nowrap",
  },
  {
    key: "total",
    header: "Total vendido",
    align: "right",
    render: (r) => money(r.total),
    csv: (r) => round2(r.total),
    sortValue: (r) => r.total,
  },
  {
    key: "items",
    header: "Itens",
    align: "right",
    render: (r) => formatNumber(r.items),
    csv: (r) => r.items,
    sortValue: (r) => r.items,
  },
  {
    key: "cost",
    header: "Custo",
    align: "right",
    render: (r) => money(r.cost),
    csv: (r) => round2(r.cost),
    sortValue: (r) => r.cost,
  },
  {
    key: "grossProfit",
    header: "Lucro bruto",
    align: "right",
    render: (r) => money(r.grossProfit),
    csv: (r) => round2(r.grossProfit),
    sortValue: (r) => r.grossProfit,
  },
  {
    key: "margin",
    header: "Margem",
    align: "right",
    render: (r) => (r.margin == null ? "—" : formatPercent(r.margin)),
    csv: (r) => round2(r.margin),
    sortValue: (r) => r.margin,
  },
];

const isSortField = (key: string): key is OrdersSortField =>
  (ordersSortFields as readonly string[]).includes(key);

/** Transactional level: search, every filter, server-side paging and CSV. */
export function OrdersList({
  data,
  options,
  search,
  period,
  onPatch,
}: {
  data: OrdersListPage;
  options: OrdersFilterOptions;
  search: OrdersSearch;
  period: PeriodSearch;
  onPatch: (next: Partial<OrdersSearch>) => void;
}) {
  const exportOrders = useServerFn(getOrdersExport);

  return (
    <>
      <OrdersFilters options={options} search={search} onPatch={onPatch} withSearch />

      <SectionBlock
        title="Pedidos"
        description="Custo, lucro bruto e margem vêm do custo unitário cadastrado por produto."
      >
        <DataTable
          columns={columns}
          rows={data.rows}
          rowKey={(r) => r.id}
          csvFileName={`pedidos-${period.inicio}-${period.fim}`}
          remote={{
            page: data.page,
            pageSize: data.pageSize,
            total: data.total,
            sort: { key: data.sort.field, direction: data.sort.direction },
            onChange: ({ page, pageSize, sort }) =>
              onPatch({
                pagina: page,
                porPagina: pageSize as OrdersSearch["porPagina"],
                ...(sort && isSortField(sort.key)
                  ? { ordenar: sort.key, direcao: sort.direction }
                  : {}),
              }),
            exportRows: () => exportOrders({ data: { ...period, ...search } }),
          }}
        />
      </SectionBlock>
    </>
  );
}
