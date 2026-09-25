import type { DataTableColumn, DataTableHeat } from "@/shared/ui/DataTable";
import { explanationOf } from "@ecommerce/contracts/glossary";
import type { ProductPerformanceRow } from "@ecommerce/contracts/marketing";
import { formatCurrency, formatNumber, formatPercent } from "@ecommerce/contracts/shared/format";

type NumericKey = Exclude<keyof ProductPerformanceRow, "key" | "name">;

const formatters = {
  count: (v: number) => formatNumber(v),
  percent: (v: number) => formatPercent(v),
  money: (v: number) => formatCurrency(v),
};

const round2 = (v: number | null) => (v == null ? null : Math.round(v * 100) / 100);

function numeric(
  key: NumericKey,
  header: string,
  format: keyof typeof formatters,
  options: { term?: string; heat?: DataTableHeat } = {},
): DataTableColumn<ProductPerformanceRow> {
  return {
    key,
    header,
    align: "right",
    render: (r) => (r[key] == null ? "—" : formatters[format](r[key])),
    csv: (r) => round2(r[key]),
    sortValue: (r) => r[key],
    hint: options.term ? explanationOf(options.term) : null,
    ...(options.heat ? { heat: options.heat } : {}),
  };
}

export const productColumns: DataTableColumn<ProductPerformanceRow>[] = [
  {
    key: "name",
    header: "Produto",
    render: (r) => r.name,
    sortValue: (r) => r.name,
    className: "min-w-48 font-semibold",
    mobile: "title",
  },
  numeric("views", "Visualizações", "count"),
  numeric("addToCart", "Carrinhos", "count"),
  numeric("cartRate", "Vistos → carrinho", "percent", { heat: "good-high" }),
  numeric("purchases", "Compras informadas", "count", { term: "gaPurchases" }),
  numeric("purchaseRate", "Vistos → compra", "percent", { heat: "good-high" }),
  numeric("units", "Unidades vendidas", "count"),
  numeric("revenue", "Receita", "money", { term: "totalSold" }),
];
