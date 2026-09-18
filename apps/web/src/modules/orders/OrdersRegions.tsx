import { BrazilTileMap } from "@/shared/ui/BrazilTileMap";
import { DataTable, type DataTableColumn } from "@/shared/ui/DataTable";
import { MetricTileGroup } from "@/shared/ui/MetricTileGroup";
import { SectionBlock } from "@/shared/ui/SectionBlock";
import { layout } from "@/shared/styles/spacing";
import { formatCurrency, formatNumber, formatPercent } from "@ecommerce/contracts/shared/format";
import type { PeriodSearch } from "@ecommerce/contracts/shared/period";
import type {
  OrdersFilterOptions,
  OrdersRegions as OrdersRegionsData,
  RegionRow,
  OrdersSearch,
} from "@ecommerce/contracts/orders";
import { OrdersFilters } from "./OrdersFilters";

const money = (v: number | null) => (v == null ? "—" : formatCurrency(v));
const pct = (v: number | null) => (v == null ? "—" : formatPercent(v));
const round2 = (v: number | null) => (v == null ? null : Math.round(v * 100) / 100);

const metricColumns: DataTableColumn<RegionRow>[] = [
  {
    key: "paid",
    header: "Total pago",
    align: "right",
    render: (r) => money(r.paid),
    csv: (r) => round2(r.paid),
    sortValue: (r) => r.paid,
  },
  {
    key: "paidShare",
    header: "% do total pago",
    align: "right",
    render: (r) => pct(r.paidShare),
    csv: (r) => round2(r.paidShare),
    sortValue: (r) => r.paidShare,
  },
  {
    key: "captured",
    header: "Total captado",
    align: "right",
    render: (r) => money(r.captured),
    csv: (r) => round2(r.captured),
    sortValue: (r) => r.captured,
  },
  {
    key: "approvalRate",
    header: "Taxa de aprovação",
    align: "right",
    render: (r) => pct(r.approvalRate == null ? null : r.approvalRate * 100),
    csv: (r) => round2(r.approvalRate == null ? null : r.approvalRate * 100),
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
    key: "capturedOrders",
    header: "Pedidos captados",
    align: "right",
    render: (r) => formatNumber(r.capturedOrders),
    csv: (r) => r.capturedOrders,
    sortValue: (r) => r.capturedOrders,
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
    key: "customers",
    header: "Clientes",
    align: "right",
    render: (r) => formatNumber(r.customers),
    csv: (r) => r.customers,
    sortValue: (r) => r.customers,
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
    key: "itemsPerOrder",
    header: "Itens por pedido",
    align: "right",
    render: (r) => (r.itemsPerOrder == null ? "—" : formatNumber(r.itemsPerOrder, 2)),
    csv: (r) => round2(r.itemsPerOrder),
    sortValue: (r) => r.itemsPerOrder,
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
    header: "Desconto por pedido pago",
    align: "right",
    render: (r) => money(r.discountPerOrder),
    csv: (r) => round2(r.discountPerOrder),
    sortValue: (r) => r.discountPerOrder,
  },
];

const provinceColumns: DataTableColumn<RegionRow>[] = [
  {
    key: "label",
    header: "Estado",
    render: (r) => r.label,
    sortValue: (r) => r.label,
    className: "font-semibold",
  },
  ...metricColumns,
];

const cityColumns: DataTableColumn<RegionRow>[] = [
  {
    key: "label",
    header: "Cidade",
    render: (r) => r.label,
    sortValue: (r) => r.label,
    className: "whitespace-nowrap font-semibold",
  },
  { key: "province", header: "UF", render: (r) => r.province, sortValue: (r) => r.province },
  ...metricColumns,
];

function overviewTiles(provinces: RegionRow[], cities: RegionRow[]) {
  const top = provinces[0];
  const topThree = provinces.slice(0, 3).reduce((s, r) => s + r.paidShare, 0);
  const note = (text: string) => ({ subNote: text });
  return [
    {
      label: "Estados com venda",
      value: formatNumber(provinces.length),
      ...note("com ao menos um pedido pago"),
    },
    {
      label: "Cidades com venda",
      value: formatNumber(cities.length),
      ...note("com ao menos um pedido pago"),
    },
    {
      label: "Maior estado",
      value: top ? top.label : "—",
      ...note(top ? `${formatPercent(top.paidShare)} do total pago` : "sem pedidos"),
    },
    {
      label: "Top 3 estados",
      value: formatPercent(topThree),
      ...note("concentração do total pago"),
    },
  ];
}

export function OrdersRegions({
  data,
  options,
  search,
  period,
  onPatch,
}: {
  data: OrdersRegionsData;
  options: OrdersFilterOptions;
  search: OrdersSearch;
  period: PeriodSearch;
  onPatch: (next: Partial<OrdersSearch>) => void;
}) {
  const suffix = `${period.inicio}-${period.fim}`;
  return (
    <>
      <OrdersFilters options={options} search={search} onPatch={onPatch} keys={["uf", "cidade"]} />

      <MetricTileGroup metrics={overviewTiles(data.provinces, data.cities)} />

      <SectionBlock
        title="Pedidos por estado"
        description="Intensidade pelo total pago no período; passe o mouse para o valor."
        bodyClassName={layout.cardPadding}
      >
        <BrazilTileMap
          values={data.provinces.map((r) => ({ state: r.province, value: r.paid }))}
          unit="currency"
          valueLabel="Total pago"
        />
      </SectionBlock>

      <SectionBlock
        title="Pedidos por estado"
        description="Cada UF com a família completa de métricas."
      >
        <DataTable
          columns={provinceColumns}
          rows={data.provinces}
          rowKey={(r) => r.key}
          initialSort={{ key: "paid", direction: "desc" }}
          csvFileName={`pedidos-estados-${suffix}`}
        />
      </SectionBlock>

      <SectionBlock title="Pedidos por cidade" description="As mesmas métricas por cidade.">
        <DataTable
          columns={cityColumns}
          rows={data.cities}
          rowKey={(r) => r.key}
          initialSort={{ key: "paid", direction: "desc" }}
          initialPageSize={20}
          csvFileName={`pedidos-cidades-${suffix}`}
        />
      </SectionBlock>
    </>
  );
}
