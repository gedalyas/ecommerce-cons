import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback } from "react";
import { ChannelToggle } from "@/shared/ui/ChannelToggle";
import { DataTable, type DataTableColumn } from "@/shared/ui/DataTable";
import { metricToTile } from "@/shared/ui/metricToTile";
import { MetricTileGroup } from "@/shared/ui/MetricTileGroup";
import { PageHeader } from "@/shared/ui/PageHeader";
import { PeriodSelector } from "@/shared/ui/PeriodSelector";
import { SectionBlock } from "@/shared/ui/SectionBlock";
import { TabBar } from "@/shared/ui/TabBar";
import { usePeriod } from "@/shared/hooks/usePeriod";
import { layout } from "@/shared/styles/spacing";
import { radiusClass } from "@/shared/styles/radius";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatPeriodLabel,
} from "@ecommerce/contracts/shared/format";
import type {
  BoughtTogetherRow,
  InventoryRow,
  ProductsScreen,
} from "@ecommerce/contracts/products";
import {
  inventoryColumns,
  outOfStockColumns,
  productColumns,
  riskColumns,
  volumeColumns,
} from "./productsColumns";
import { ProductsFilters } from "./ProductsFilters";
import {
  salesWindows,
  stockChips,
  type ProductsSearch,
  type SalesWindow,
  type StockChip,
} from "@ecommerce/contracts/products";

const tabs = [
  { key: "resumo", label: "Resumo" },
  { key: "lista", label: "Lista" },
  { key: "estoque", label: "Estoque" },
] as const;

const stockChipLabel: Record<StockChip, string> = {
  todos: "Todos",
  risco: "Risco de estoque",
  velocidade: "Maior velocidade",
  "sem-estoque": "Sem estoque",
};

const salesWindowLabel: Record<SalesWindow, string> = {
  total: "Todos os tempos",
  "90": "90 dias",
  "30": "30 dias",
  "7": "7 dias",
};

const soldIn = (r: InventoryRow, w: SalesWindow) =>
  w === "total" ? r.soldTotal : w === "90" ? r.sold90 : w === "30" ? r.sold30 : r.sold7;

const boughtTogetherColumns: DataTableColumn<BoughtTogetherRow>[] = [
  { key: "a", header: "Produto 1", render: (r) => r.productA, className: "whitespace-nowrap" },
  { key: "b", header: "Produto 2", render: (r) => r.productB, className: "whitespace-nowrap" },
  {
    key: "times",
    header: "Vezes comprados juntos",
    align: "right",
    render: (r) => formatNumber(r.times),
    csv: (r) => r.times,
    sortValue: (r) => r.times,
  },
  {
    key: "bundle",
    header: "Valor médio do pacote",
    align: "right",
    render: (r) => formatCurrency(r.averageBundle),
    csv: (r) => Math.round(r.averageBundle * 100) / 100,
    sortValue: (r) => r.averageBundle,
  },
];

function Chips<K extends string>({
  options,
  labels,
  value,
  onChange,
  ariaLabel,
}: {
  options: readonly K[];
  labels: Record<K, string>;
  value: K;
  onChange: (next: K) => void;
  ariaLabel: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex flex-wrap gap-1">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={o === value}
          onClick={() => onChange(o)}
          className={cn(
            "h-8 border px-3 text-[13px] leading-[18px] transition-colors duration-150",
            radiusClass.control,
            o === value
              ? "border-primary bg-success-soft font-semibold text-primary"
              : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground",
          )}
        >
          {labels[o]}
        </button>
      ))}
    </div>
  );
}

export function Products({ data }: { data: ProductsScreen }) {
  const { period, setPeriod, comparison } = usePeriod();
  const search = useSearch({ from: "/produtos" });
  const navigate = useNavigate();
  const patch = useCallback(
    (next: Partial<ProductsSearch>) =>
      void navigate({
        to: "/produtos",
        search: (prev: Record<string, unknown>) => ({ ...prev, ...next }),
        replace: true,
      }),
    [navigate],
  );
  const comparisonLabel = comparison
    ? `vs ${formatPeriodLabel(comparison.inicio, comparison.fim)}`
    : "sem comparação";
  const periodLabel = formatPeriodLabel(period.inicio, period.fim);

  return (
    <div className={layout.page}>
      <PageHeader
        title="Produtos"
        subtitle={`Vendas, curva ABC e estoque · ${periodLabel} · Loja Aurora`}
      />

      <div className={cn(layout.headerGap, layout.blockStack)}>
        {data.aba !== "estoque" && (
          <div className="flex flex-wrap items-center gap-2">
            <PeriodSelector value={period} onChange={setPeriod} />
            <ChannelToggle value={period.canal} onChange={(canal) => setPeriod({ canal })} />
          </div>
        )}

        <TabBar tabs={tabs} value={data.aba} onChange={(aba) => patch({ aba })} />

        {data.aba === "resumo" && (
          <>
            <MetricTileGroup
              metrics={data.summary.metrics.map((m) =>
                metricToTile({
                  label: m.label,
                  metric: m.metric,
                  comparisonLabel,
                  goodWhen: m.goodWhen,
                }),
              )}
            />
            <SectionBlock
              title="Volume de vendas · 20 mais vendidos"
              description={`Unidades, receita e margem em ${periodLabel}.`}
            >
              <DataTable
                columns={volumeColumns}
                rows={data.summary.topByVolume}
                rowKey={(r) => r.productId}
                initialSort={{ key: "units", direction: "desc" }}
                csvFileName={`produtos-mais-vendidos-${period.inicio}-${period.fim}`}
              />
            </SectionBlock>
            <SectionBlock
              title="Volume de vendas · 20 menos vendidos"
              description="Entre os que venderam ao menos uma unidade no período."
            >
              <DataTable
                columns={volumeColumns}
                rows={data.summary.bottomByVolume}
                rowKey={(r) => r.productId}
                initialSort={{ key: "units", direction: "asc" }}
                csvFileName={`produtos-menos-vendidos-${period.inicio}-${period.fim}`}
              />
            </SectionBlock>
            <SectionBlock
              title="Risco de estoque"
              description="Variantes que zeram em até 15 dias no ritmo dos últimos 30. Independe do período selecionado."
            >
              <DataTable
                columns={riskColumns}
                rows={data.summary.atRisk}
                rowKey={(r) => r.variantId}
                initialSort={{ key: "daysToZero", direction: "asc" }}
                csvFileName="risco-de-estoque"
                emptyMessage="Nenhuma variante em risco nos próximos 15 dias."
              />
            </SectionBlock>
            <SectionBlock
              title="Produtos fora de estoque"
              description="Receita perdida estimada pelo ritmo histórico desde a última venda."
            >
              <DataTable
                columns={outOfStockColumns}
                rows={data.summary.outOfStock}
                rowKey={(r) => r.variantId}
                initialSort={{ key: "lostRevenue", direction: "desc" }}
                csvFileName="fora-de-estoque"
                emptyMessage="Nenhuma variante sem estoque."
              />
            </SectionBlock>
            <SectionBlock
              title="Produtos comprados juntos"
              description="Pares que aparecem no mesmo pedido pago no período."
            >
              <DataTable
                columns={boughtTogetherColumns}
                rows={data.summary.boughtTogether}
                rowKey={(r) => `${r.productA}|${r.productB}`}
                csvFileName={`comprados-juntos-${period.inicio}-${period.fim}`}
              />
            </SectionBlock>
          </>
        )}

        {data.aba === "lista" && (
          <>
            <ProductsFilters options={data.list.options} search={search} onPatch={patch} />
            <SectionBlock
              title="Análise ABC"
              description="Curva de Pareto pela receita acumulada do período: A até 80%, B até 95%, C a cauda."
              bodyClassName={cn(layout.cardPadding, "grid gap-4 sm:grid-cols-3")}
            >
              {data.list.abc.map((c) => (
                <div key={c.abcClass} className={cn("border border-border p-4", radiusClass.card)}>
                  <div className={cn(textClass.label, "text-muted-foreground")}>
                    Classe {c.abcClass}
                  </div>
                  <div className={cn(textClass.kpi, textClass.numeric, "mt-1 text-foreground")}>
                    {formatNumber(c.products)}
                  </div>
                  <div className={cn(textClass.meta, textClass.numeric, "text-muted-foreground")}>
                    {formatCurrency(c.revenue)} · {formatPercent(c.revenueShare)} da receita
                  </div>
                </div>
              ))}
            </SectionBlock>
            <SectionBlock
              title="Produtos"
              description="Sessões e taxa de conversão por produto dependem do GA4 por página de produto — pendência de dado."
            >
              <DataTable
                columns={productColumns}
                rows={data.list.rows}
                rowKey={(r) => r.productId}
                initialSort={{ key: "revenue", direction: "desc" }}
                initialPageSize={20}
                csvFileName={`produtos-${period.inicio}-${period.fim}`}
              />
            </SectionBlock>
          </>
        )}

        {data.aba === "estoque" && (
          <>
            <div className="flex flex-wrap items-center gap-4">
              <Chips
                options={stockChips}
                labels={stockChipLabel}
                value={search.estoque}
                onChange={(estoque) => patch({ estoque })}
                ariaLabel="Filtro de estoque"
              />
              <Chips
                options={salesWindows}
                labels={salesWindowLabel}
                value={search.janela}
                onChange={(janela) => patch({ janela })}
                ariaLabel="Janela de vendas"
              />
            </div>
            <ProductsFilters options={data.inventory.options} search={search} onPatch={patch} />
            <SectionBlock
              title="Estoque por variante"
              description="Posição atual, independente do período: velocidade, dias para zerar, valor imobilizado e o custo de cada ruptura."
            >
              <DataTable
                columns={inventoryColumns}
                rows={filterInventory(data.inventory.rows, search.estoque, search.janela)}
                rowKey={(r) => r.variantId}
                initialSort={{
                  key: sortKeyFor(search.estoque),
                  direction: search.estoque === "risco" ? "asc" : "desc",
                }}
                initialPageSize={20}
                csvFileName="estoque"
              />
            </SectionBlock>
          </>
        )}
      </div>
    </div>
  );
}

function filterInventory(rows: InventoryRow[], chip: StockChip, window: SalesWindow) {
  const base =
    chip === "risco"
      ? rows.filter((r) => r.daysToZero != null && r.daysToZero <= 15)
      : chip === "sem-estoque"
        ? rows.filter((r) => r.stockQty <= 0)
        : rows;
  return [...base].sort((a, b) => soldIn(b, window) - soldIn(a, window));
}

const sortKeyFor = (chip: StockChip) =>
  chip === "risco" ? "daysToZero" : chip === "sem-estoque" ? "lostRevenue" : "velocity";
