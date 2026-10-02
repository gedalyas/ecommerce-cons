import type { DataTableColumn } from "@/shared/ui/DataTable";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
} from "@ecommerce/contracts/shared/format";
import type { InventoryRow, ProductRow } from "@ecommerce/contracts/products";

const round2 = (v: number | null) => (v == null ? null : Math.round(v * 100) / 100);
const money = (v: number | null) => (v == null ? "—" : formatCurrency(v));
const pct = (v: number | null) => (v == null ? "—" : formatPercent(v));
const days = (v: number | null) => (v == null ? "—" : `${formatNumber(v, v < 10 ? 1 : 0)} d`);
const day = (iso: string | null) =>
  iso ? formatDate(iso, { day: "2-digit", month: "2-digit", year: "2-digit" }) : "—";

const quantity = (v: number | null) => (v == null ? "—" : formatNumber(v));

export const stockHealthLabel: Record<NonNullable<ProductRow["stockHealth"]>, string> = {
  ok: "OK",
  risco: "Risco",
  "sem-estoque": "Sem estoque",
};

const nameColumn: DataTableColumn<ProductRow> = {
  key: "name",
  header: "Nome",
  render: (r) => r.name,
  sortValue: (r) => r.name,
  className: "whitespace-nowrap font-semibold",
};

export const productColumns: DataTableColumn<ProductRow>[] = [
  nameColumn,
  {
    key: "abcClass",
    header: "Classe",
    align: "right",
    render: (r) => r.abcClass,
    sortValue: (r) => r.abcClass,
  },
  {
    key: "category",
    header: "Categoria",
    render: (r) => r.category,
    sortValue: (r) => r.category,
    className: "whitespace-nowrap",
  },
  {
    key: "stockHealth",
    header: "Saúde do estoque",
    render: (r) => (r.stockHealth ? stockHealthLabel[r.stockHealth] : "—"),
    csv: (r) => (r.stockHealth ? stockHealthLabel[r.stockHealth] : null),
    sortValue: (r) => r.stockHealth,
  },
  {
    key: "units",
    header: "Unidades vendidas",
    align: "right",
    render: (r) => formatNumber(r.units),
    csv: (r) => r.units,
    sortValue: (r) => r.units,
  },
  {
    key: "revenue",
    header: "Total vendido",
    mobile: "lead",
    align: "right",
    render: (r) => money(r.revenue),
    csv: (r) => round2(r.revenue),
    sortValue: (r) => r.revenue,
  },
  {
    key: "revenueShare",
    header: "% das vendas",
    align: "right",
    render: (r) => pct(r.revenueShare),
    csv: (r) => round2(r.revenueShare),
    sortValue: (r) => r.revenueShare,
  },
  {
    key: "profit",
    header: "Lucro",
    align: "right",
    render: (r) => money(r.profit),
    csv: (r) => round2(r.profit),
    sortValue: (r) => r.profit,
  },
  {
    key: "averagePrice",
    header: "Preço médio",
    align: "right",
    render: (r) => money(r.averagePrice),
    csv: (r) => round2(r.averagePrice),
    sortValue: (r) => r.averagePrice,
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
    key: "margin",
    header: "Margem",
    align: "right",
    render: (r) => pct(r.margin),
    csv: (r) => round2(r.margin),
    sortValue: (r) => r.margin,
  },
];

export const volumeColumns: DataTableColumn<ProductRow>[] = [
  nameColumn,
  {
    key: "units",
    header: "Quantidade",
    align: "right",
    render: (r) => formatNumber(r.units),
    csv: (r) => r.units,
    sortValue: (r) => r.units,
  },
  {
    key: "revenue",
    header: "Total vendido",
    mobile: "lead",
    align: "right",
    render: (r) => money(r.revenue),
    csv: (r) => round2(r.revenue),
    sortValue: (r) => r.revenue,
  },
  {
    key: "margin",
    header: "Margem",
    align: "right",
    render: (r) => pct(r.margin),
    csv: (r) => round2(r.margin),
    sortValue: (r) => r.margin,
  },
];

const variantColumns: DataTableColumn<InventoryRow>[] = [
  {
    key: "productName",
    header: "Produto",
    render: (r) => r.productName,
    sortValue: (r) => r.productName,
    className: "whitespace-nowrap font-semibold",
  },
  {
    key: "variantName",
    header: "Variante",
    render: (r) => r.variantName ?? "—",
    csv: (r) => r.variantName,
    className: "whitespace-nowrap",
  },
  { key: "sku", header: "SKU", render: (r) => r.sku, className: "whitespace-nowrap" },
  {
    key: "stockQty",
    header: "Estoque",
    align: "right",
    render: (r) => quantity(r.stockQty),
    csv: (r) => r.stockQty,
    sortValue: (r) => r.stockQty,
  },
];

export const riskColumns: DataTableColumn<InventoryRow>[] = [
  ...variantColumns,
  {
    key: "velocity",
    header: "Vendas diárias estimadas",
    align: "right",
    render: (r) => formatNumber(r.velocity, 1),
    csv: (r) => round2(r.velocity),
    sortValue: (r) => r.velocity,
  },
  {
    key: "daysToZero",
    header: "Dias para zerar",
    align: "right",
    render: (r) => days(r.daysToZero),
    csv: (r) => round2(r.daysToZero),
    sortValue: (r) => r.daysToZero,
  },
  {
    key: "stockOutDate",
    header: "Data estimada de falta",
    render: (r) => day(r.stockOutDate),
    csv: (r) => r.stockOutDate,
    sortValue: (r) => r.stockOutDate,
    className: "whitespace-nowrap",
  },
];

export const outOfStockColumns: DataTableColumn<InventoryRow>[] = [
  ...variantColumns,
  {
    key: "daysOutOfStock",
    header: "Dias desde a última venda",
    align: "right",
    render: (r) => days(r.daysOutOfStock),
    csv: (r) => r.daysOutOfStock,
    sortValue: (r) => r.daysOutOfStock,
  },
  {
    key: "lastSaleAt",
    header: "Última venda",
    render: (r) => day(r.lastSaleAt),
    csv: (r) => r.lastSaleAt,
    sortValue: (r) => r.lastSaleAt,
    className: "whitespace-nowrap",
  },
  {
    key: "lostRevenue",
    header: "Receita perdida",
    align: "right",
    render: (r) => money(r.lostRevenueSinceStockOut),
    csv: (r) => round2(r.lostRevenueSinceStockOut),
    sortValue: (r) => r.lostRevenueSinceStockOut,
  },
];

export const inventoryColumns: DataTableColumn<InventoryRow>[] = [
  ...variantColumns,
  {
    key: "marketplaceStock",
    header: "Estoque de quem",
    render: (r) => (r.marketplaceStock ? "Do marketplace (Full / FBA)" : "Da loja"),
    csv: (r) => (r.marketplaceStock ? "Do marketplace" : "Da loja"),
    sortValue: (r) => (r.marketplaceStock ? 1 : 0),
    className: "whitespace-nowrap",
  },
  {
    key: "soldTotal",
    header: "Vendas desde o início",
    align: "right",
    render: (r) => formatNumber(r.soldTotal),
    csv: (r) => r.soldTotal,
    sortValue: (r) => r.soldTotal,
  },
  {
    key: "sold90",
    header: "90 dias",
    align: "right",
    render: (r) => formatNumber(r.sold90),
    csv: (r) => r.sold90,
    sortValue: (r) => r.sold90,
  },
  {
    key: "sold30",
    header: "30 dias",
    align: "right",
    render: (r) => formatNumber(r.sold30),
    csv: (r) => r.sold30,
    sortValue: (r) => r.sold30,
  },
  {
    key: "sold7",
    header: "7 dias",
    align: "right",
    render: (r) => formatNumber(r.sold7),
    csv: (r) => r.sold7,
    sortValue: (r) => r.sold7,
  },
  {
    key: "velocity",
    header: "Velocidade (un./dia)",
    align: "right",
    render: (r) => formatNumber(r.velocity, 2),
    csv: (r) => round2(r.velocity),
    sortValue: (r) => r.velocity,
  },
  {
    key: "daysToZero",
    header: "Dias para zerar",
    align: "right",
    render: (r) => days(r.daysToZero),
    csv: (r) => round2(r.daysToZero),
    sortValue: (r) => r.daysToZero,
  },
  {
    key: "stockOutDate",
    header: "Fim de estoque",
    render: (r) => day(r.stockOutDate),
    csv: (r) => r.stockOutDate,
    sortValue: (r) => r.stockOutDate,
    className: "whitespace-nowrap",
  },
  {
    key: "lastSaleAt",
    header: "Última venda",
    render: (r) => day(r.lastSaleAt),
    csv: (r) => r.lastSaleAt,
    sortValue: (r) => r.lastSaleAt,
    className: "whitespace-nowrap",
  },
  {
    key: "stockValue",
    header: "Valor do estoque",
    align: "right",
    render: (r) => money(r.stockValue),
    csv: (r) => round2(r.stockValue),
    sortValue: (r) => r.stockValue,
  },
  {
    key: "revenuePotential",
    header: "Potencial de receita",
    align: "right",
    render: (r) => money(r.revenuePotential),
    csv: (r) => round2(r.revenuePotential),
    sortValue: (r) => r.revenuePotential,
  },
  {
    key: "lostRevenue",
    header: "Receita perdida desde ruptura",
    align: "right",
    render: (r) => money(r.lostRevenueSinceStockOut),
    csv: (r) => round2(r.lostRevenueSinceStockOut),
    sortValue: (r) => r.lostRevenueSinceStockOut,
  },
  {
    key: "stockOutCostPerDay",
    header: "Custo de ruptura/dia",
    align: "right",
    render: (r) => money(r.stockOutCostPerDay),
    csv: (r) => round2(r.stockOutCostPerDay),
    sortValue: (r) => r.stockOutCostPerDay,
  },
];
