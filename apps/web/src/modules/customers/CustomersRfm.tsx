import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/shared/ui/Button";
import { DataTable, type DataTableColumn } from "@/shared/ui/DataTable";
import { SectionBlock } from "@/shared/ui/SectionBlock";
import { TreemapChart } from "@/shared/ui/TreemapChart";
import { layout } from "@/shared/styles/spacing";
import { radiusClass } from "@/shared/styles/radius";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { formatCurrency, formatDate, formatNumber } from "@/shared/utils/format";
import type { PeriodSearch } from "@ecommerce/contracts/shared/period";
import type {
  CustomersRfm as CustomersRfmData,
  RfmCustomerRow,
} from "@ecommerce/contracts/customers";
import { getCustomersExport, refreshCustomerSegments } from "./customersController";
import {
  customersSortFields,
  type CustomersSearch,
  type CustomersSortField,
} from "@ecommerce/contracts/customers";
import { RfmFilters } from "./RfmFilters";

const columns: DataTableColumn<RfmCustomerRow>[] = [
  {
    key: "name",
    header: "Nome",
    render: (r) => r.name,
    sortValue: (r) => r.name,
    className: "whitespace-nowrap font-semibold",
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
    key: "segment",
    header: "Segmento RFM",
    render: (r) => r.segment,
    className: "whitespace-nowrap",
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
    key: "total",
    header: "Total vendido",
    align: "right",
    render: (r) => formatCurrency(r.total, 2),
    csv: (r) => Math.round(r.total * 100) / 100,
    sortValue: (r) => r.total,
  },
  {
    key: "lastOrderAt",
    header: "Última compra",
    render: (r) =>
      r.lastOrderAt
        ? formatDate(r.lastOrderAt, { day: "2-digit", month: "2-digit", year: "2-digit" })
        : "—",
    csv: (r) => r.lastOrderAt,
    sortValue: (r) => r.lastOrderAt,
    className: "whitespace-nowrap",
  },
  { key: "source", header: "Origem", render: (r) => r.source ?? "—", csv: (r) => r.source },
  {
    key: "city",
    header: "Cidade / UF",
    render: (r) => (r.city ? `${r.city} / ${r.province}` : "—"),
    csv: (r) => (r.city ? `${r.city} / ${r.province}` : null),
    className: "whitespace-nowrap",
  },
];

const isSortField = (key: string): key is CustomersSortField =>
  (customersSortFields as readonly string[]).includes(key);

/** Segmentation over the whole base (no period): treemap + the actionable customer list. */
export function CustomersRfm({
  data,
  search,
  period,
  onPatch,
}: {
  data: CustomersRfmData;
  search: CustomersSearch;
  period: PeriodSearch;
  onPatch: (next: Partial<CustomersSearch>) => void;
}) {
  const router = useRouter();
  const exportCustomers = useServerFn(getCustomersExport);
  const refresh = useServerFn(refreshCustomerSegments);
  const [measure, setMeasure] = useState<"customers" | "revenue">("customers");
  const [refreshing, setRefreshing] = useState(false);

  const items = data.segments.map((s) => {
    const value = measure === "customers" ? s.customers : s.revenue;
    const total = data.segments.reduce(
      (t, x) => t + (measure === "customers" ? x.customers : x.revenue),
      0,
    );
    return { key: s.key, label: s.label, value, share: total > 0 ? (value / total) * 100 : 0 };
  });

  const runRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
      await router.invalidate();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <>
      <RfmFilters options={data.options} search={search} onPatch={onPatch} />

      <SectionBlock
        title="Distribuição por segmento"
        description="O tamanho de cada área representa a base filtrada; alterne entre clientes e receita acumulada."
        meta={
          <div className="flex items-center gap-2">
            <div
              role="radiogroup"
              aria-label="Medida do treemap"
              className={cn(
                "inline-flex h-8 items-center gap-1 border border-border bg-card p-0.5",
                radiusClass.control,
              )}
            >
              {(["customers", "revenue"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={measure === m}
                  onClick={() => setMeasure(m)}
                  className={cn(
                    "h-7 px-3 text-[13px] leading-[18px]",
                    radiusClass.badge,
                    measure === m
                      ? "bg-primary font-semibold text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m === "customers" ? "Clientes" : "Total vendido"}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void runRefresh()}
              disabled={refreshing}
            >
              {refreshing ? "Recalculando…" : "Recalcular segmentos"}
            </Button>
          </div>
        }
        bodyClassName={layout.cardPadding}
      >
        <TreemapChart items={items} unit={measure === "customers" ? "count" : "currency"} />
        <p className={cn(textClass.meta, textClass.numeric, "mt-3 text-muted-foreground")}>
          {formatNumber(data.page.total)} de {formatNumber(data.buyers)} clientes com compra na
          base.
        </p>
      </SectionBlock>

      <SectionBlock
        title="Clientes"
        description="A lista filtrada é a audiência: exporte em CSV para a campanha de e-mail ou WhatsApp."
      >
        <DataTable
          columns={columns}
          rows={data.page.rows}
          rowKey={(r) => r.id}
          csvFileName={`clientes-${period.inicio}-${period.fim}`}
          remote={{
            page: data.page.page,
            pageSize: data.page.pageSize,
            total: data.page.total,
            sort: { key: data.page.sort.field, direction: data.page.sort.direction },
            onChange: ({ page, pageSize, sort }) =>
              onPatch({
                pagina: page,
                porPagina: pageSize as CustomersSearch["porPagina"],
                ...(sort && isSortField(sort.key)
                  ? { ordenar: sort.key, direcao: sort.direction }
                  : {}),
              }),
            exportRows: () => exportCustomers({ data: { ...period, ...search } }),
          }}
        />
      </SectionBlock>
    </>
  );
}
