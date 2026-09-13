import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import type { DataTableColumn } from "@/shared/ui/DataTable";
import { formatCurrency, formatNumber, formatPercent } from "@/shared/utils/format";
import type { InfluencerRow } from "./influencers.types";

const money = (v: number | null) => (v == null ? "—" : formatCurrency(v));
const pct = (v: number | null) => (v == null ? "—" : formatPercent(v));
const round2 = (v: number | null) => (v == null ? null : Math.round(v * 100) / 100);

export function influencerColumns({
  onEdit,
  onDelete,
}: {
  onEdit: (row: InfluencerRow) => void;
  onDelete: (row: InfluencerRow) => void;
}): DataTableColumn<InfluencerRow>[] {
  return [
    {
      key: "name",
      header: "Nome",
      render: (r) => (
        <span className="flex flex-col">
          <span className="font-semibold">{r.name}</span>
          {r.handle && <span className="text-muted-foreground">{r.handle}</span>}
        </span>
      ),
      csv: (r) => r.name,
      sortValue: (r) => r.name,
      renderTotal: (r) => r.name,
      className: "whitespace-nowrap",
    },
    {
      key: "coupons",
      header: "Cupons",
      render: (r) => r.coupons.map((c) => c.code).join(", ") || "—",
      csv: (r) => r.coupons.map((c) => c.code).join(" "),
      renderTotal: () => "",
    },
    {
      key: "orders",
      header: "Total de vendas",
      align: "right",
      render: (r) => formatNumber(r.orders),
      csv: (r) => r.orders,
      sortValue: (r) => r.orders,
    },
    {
      key: "revenue",
      header: "Receita total",
      align: "right",
      render: (r) => money(r.revenue),
      csv: (r) => round2(r.revenue),
      sortValue: (r) => r.revenue,
    },
    {
      key: "cost",
      header: "Custo total",
      align: "right",
      render: (r) => money(r.cost),
      csv: (r) => round2(r.cost),
      sortValue: (r) => r.cost,
    },
    {
      key: "roi",
      header: "ROI",
      align: "right",
      render: (r) => pct(r.roi),
      csv: (r) => round2(r.roi),
      sortValue: (r) => r.roi,
    },
    {
      key: "shippingRevenue",
      header: "Receita de frete",
      align: "right",
      render: (r) => money(r.shippingRevenue),
      csv: (r) => round2(r.shippingRevenue),
      sortValue: (r) => r.shippingRevenue,
    },
    {
      key: "productRevenue",
      header: "Receita de produtos",
      align: "right",
      render: (r) => money(r.productRevenue),
      csv: (r) => round2(r.productRevenue),
      sortValue: (r) => r.productRevenue,
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
      key: "newCustomers",
      header: "Novos clientes",
      align: "right",
      render: (r) => formatNumber(r.newCustomers),
      csv: (r) => r.newCustomers,
      sortValue: (r) => r.newCustomers,
    },
    {
      key: "repurchaseRate",
      header: "Taxa de recompra",
      align: "right",
      render: (r) => pct(r.repurchaseRate),
      csv: (r) => round2(r.repurchaseRate),
      sortValue: (r) => r.repurchaseRate,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <span className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Editar ${r.name}`}
            onClick={() => onEdit(r)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Excluir ${r.name}`}
            onClick={() => onDelete(r)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </span>
      ),
      csv: () => "",
      renderTotal: () => "",
    },
  ];
}
