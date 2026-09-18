import { BrazilTileMap } from "@/shared/ui/BrazilTileMap";
import { DataTable, type DataTableColumn } from "@/shared/ui/DataTable";
import { MetricTileGroup } from "@/shared/ui/MetricTileGroup";
import { SectionBlock } from "@/shared/ui/SectionBlock";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { layout } from "@/shared/styles/spacing";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import {
  formatCurrency,
  formatMultiplier,
  formatNumber,
  formatPercent,
} from "@ecommerce/contracts/shared/format";
import type { PeriodSearch } from "@ecommerce/contracts/shared/period";
import type {
  MarketingRegions,
  RegionPerformanceRow,
  MarketingSearch,
} from "@ecommerce/contracts/marketing";
import { roasQuality, roasQualityLabel } from "@ecommerce/contracts/marketing";

const money = (v: number | null) => (v == null ? "—" : formatCurrency(v));
const money2 = (v: number | null) => (v == null ? "—" : formatCurrency(v, 2));
const pct = (v: number | null) => (v == null ? "—" : formatPercent(v));
const times = (v: number | null) => (v == null ? "—" : formatMultiplier(v));
const round2 = (v: number | null) => (v == null ? null : Math.round(v * 100) / 100);

const mapMetrics = [
  { key: "roas", label: "ROAS" },
  { key: "revenue", label: "Total vendido" },
  { key: "totalSpend", label: "Gasto total" },
  { key: "cac", label: "CAC" },
] as const;
type MapMetric = (typeof mapMetrics)[number]["key"];
const mapUnit: Record<MapMetric, "multiplier" | "currency"> = {
  roas: "multiplier",
  revenue: "currency",
  totalSpend: "currency",
  cac: "currency",
};

const columns: DataTableColumn<RegionPerformanceRow>[] = [
  {
    key: "province",
    header: "Estado",
    render: (r) => r.province,
    sortValue: (r) => r.province,
    className: "font-semibold",
  },
  {
    key: "metaSpend",
    header: "Investimento Meta",
    align: "right",
    render: (r) => money(r.metaSpend),
    csv: (r) => round2(r.metaSpend),
    sortValue: (r) => r.metaSpend,
  },
  {
    key: "googleSpend",
    header: "Investimento Google",
    align: "right",
    render: (r) => money(r.googleSpend),
    csv: (r) => round2(r.googleSpend),
    sortValue: (r) => r.googleSpend,
  },
  {
    key: "tiktokSpend",
    header: "Investimento TikTok",
    align: "right",
    render: (r) => money(r.tiktokSpend),
    csv: (r) => round2(r.tiktokSpend),
    sortValue: (r) => r.tiktokSpend,
  },
  {
    key: "totalSpend",
    header: "Gasto total",
    align: "right",
    render: (r) => money(r.totalSpend),
    csv: (r) => round2(r.totalSpend),
    sortValue: (r) => r.totalSpend,
  },
  {
    key: "revenue",
    header: "Total vendido",
    align: "right",
    render: (r) => money(r.revenue),
    csv: (r) => round2(r.revenue),
    sortValue: (r) => r.revenue,
  },
  {
    key: "roas",
    header: "ROAS",
    align: "right",
    render: (r) => times(r.roas),
    csv: (r) => round2(r.roas),
    sortValue: (r) => r.roas,
  },
  {
    key: "cpm",
    header: "CPM",
    align: "right",
    render: (r) => money2(r.cpm),
    csv: (r) => round2(r.cpm),
    sortValue: (r) => r.cpm,
  },
  {
    key: "cpc",
    header: "CPC",
    align: "right",
    render: (r) => money2(r.cpc),
    csv: (r) => round2(r.cpc),
    sortValue: (r) => r.cpc,
  },
  {
    key: "cpa",
    header: "CPA",
    align: "right",
    render: (r) => money(r.cpa),
    csv: (r) => round2(r.cpa),
    sortValue: (r) => r.cpa,
  },
  {
    key: "cac",
    header: "CAC",
    align: "right",
    render: (r) => money(r.cac),
    csv: (r) => round2(r.cac),
    sortValue: (r) => r.cac,
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
    key: "averageTicket",
    header: "Ticket médio",
    align: "right",
    render: (r) => money(r.averageTicket),
    csv: (r) => round2(r.averageTicket),
    sortValue: (r) => r.averageTicket,
  },
  {
    key: "repurchaseRate",
    header: "Taxa de recompra",
    align: "right",
    render: (r) => pct(r.repurchaseRate),
    csv: (r) => round2(r.repurchaseRate),
    sortValue: (r) => r.repurchaseRate,
  },
];

function bigNumbers(data: MarketingRegions) {
  const withSpend = data.rows.filter((r) => r.totalSpend > 0 && r.roas != null);
  const best = [...withSpend].sort((a, b) => (b.roas ?? 0) - (a.roas ?? 0))[0];
  const worst = [...withSpend].sort((a, b) => (a.roas ?? 0) - (b.roas ?? 0))[0];
  return [
    {
      label: "Gasto total",
      value: formatCurrency(data.total.totalSpend),
      subNote: `${formatNumber(withSpend.length)} estados com mídia`,
    },
    {
      label: "ROAS geral",
      value: times(data.total.roas),
      subNote: roasQualityLabel[roasQuality(data.total.roas)],
    },
    {
      label: "Melhor ROAS",
      value: best ? `${best.province} · ${times(best.roas)}` : "—",
      subNote: best ? `${formatCurrency(best.totalSpend)} investidos` : "sem mídia",
    },
    {
      label: "Pior ROAS",
      value: worst ? `${worst.province} · ${times(worst.roas)}` : "—",
      subNote: worst ? `${formatCurrency(worst.totalSpend)} investidos` : "sem mídia",
    },
  ];
}

export function MarketingRegioes({
  data,
  search,
  period,
  onPatch,
}: {
  data: MarketingRegions;
  search: MarketingSearch;
  period: PeriodSearch;
  onPatch: (next: Partial<MarketingSearch>) => void;
}) {
  const metric = search.mapa;
  return (
    <>
      <MetricTileGroup metrics={bigNumbers(data)} />

      <SectionBlock
        title="ROAS por estado"
        description="Onde o investimento em mídia converte melhor; passe o mouse para o valor."
        meta={
          <div className="flex flex-wrap items-center gap-3">
            <SegmentedControl
              label="Métrica do mapa"
              options={mapMetrics}
              value={metric}
              onChange={(mapa) => onPatch({ mapa })}
            />
            <label className={cn(textClass.meta, "flex items-center gap-2 text-muted-foreground")}>
              <input
                type="checkbox"
                className="accent-primary"
                checked={search.incluirTaxa}
                onChange={(e) => onPatch({ incluirTaxa: e.target.checked })}
              />
              Incluir taxa da plataforma
            </label>
          </div>
        }
        bodyClassName={layout.cardPadding}
      >
        <BrazilTileMap
          values={data.rows.map((r) => ({ state: r.province, value: r[metric] }))}
          unit={mapUnit[metric]}
          valueLabel={mapMetrics.find((m) => m.key === metric)!.label}
        />
      </SectionBlock>

      <SectionBlock
        title="Desempenho regional"
        description="Mídia por plataforma com recorte geográfico contra os pedidos pagos da loja por UF de entrega."
      >
        <DataTable
          columns={columns}
          rows={data.rows}
          totalRow={data.total}
          rowKey={(r) => r.province}
          initialSort={{ key: "revenue", direction: "desc" }}
          csvFileName={`marketing-regioes-${period.inicio}-${period.fim}`}
        />
      </SectionBlock>
    </>
  );
}
