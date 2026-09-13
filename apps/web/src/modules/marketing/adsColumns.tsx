import { Badge } from "@/shared/ui/Badge";
import type { DataTableColumn } from "@/shared/ui/DataTable";
import {
  formatCurrency,
  formatMultiplier,
  formatNumber,
  formatPercent,
} from "@/shared/utils/format";
import type { AdPerformanceRow, AdLevel } from "@ecommerce/contracts/marketing";
import { roasQualityLabel, type RoasQuality } from "@ecommerce/contracts/marketing";

const money = (v: number | null) => (v == null ? "—" : formatCurrency(v));
const money2 = (v: number | null) => (v == null ? "—" : formatCurrency(v, 2));
const pct = (v: number | null) => (v == null ? "—" : formatPercent(v));
const round2 = (v: number | null) => (v == null ? null : Math.round(v * 100) / 100);

const qualityTone: Record<RoasQuality, "accent" | "muted" | "warning"> = {
  alto: "accent",
  medio: "muted",
  baixo: "warning",
};

const roasCell = (r: AdPerformanceRow) =>
  r.roas == null ? (
    "—"
  ) : (
    <span className="inline-flex items-center justify-end gap-2">
      {formatMultiplier(r.roas)}
      <Badge tone={qualityTone[r.roasQuality]}>
        {roasQualityLabel[r.roasQuality].split(" ")[0]}
      </Badge>
    </span>
  );

const metricColumns: DataTableColumn<AdPerformanceRow>[] = [
  {
    key: "spend",
    header: "Investimento",
    align: "right",
    render: (r) => money(r.spend),
    csv: (r) => round2(r.spend),
    sortValue: (r) => r.spend,
  },
  {
    key: "revenue",
    header: "Receita atribuída",
    align: "right",
    render: (r) => money(r.revenue),
    csv: (r) => round2(r.revenue),
    sortValue: (r) => r.revenue,
  },
  {
    key: "roas",
    header: "ROAS",
    align: "right",
    render: roasCell,
    csv: (r) => round2(r.roas),
    sortValue: (r) => r.roas,
    className: "whitespace-nowrap",
  },
  {
    key: "orders",
    header: "Conversões",
    align: "right",
    render: (r) => formatNumber(r.orders),
    csv: (r) => r.orders,
    sortValue: (r) => r.orders,
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
    key: "impressions",
    header: "Impressões",
    align: "right",
    render: (r) => formatNumber(r.impressions),
    csv: (r) => r.impressions,
    sortValue: (r) => r.impressions,
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
    key: "clicks",
    header: "Cliques",
    align: "right",
    render: (r) => formatNumber(r.clicks),
    csv: (r) => r.clicks,
    sortValue: (r) => r.clicks,
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
    key: "ctr",
    header: "CTR",
    align: "right",
    render: (r) => pct(r.ctr),
    csv: (r) => round2(r.ctr),
    sortValue: (r) => r.ctr,
  },
];

/** The platform summary: one row per platform plus the total. */
export const platformColumns: DataTableColumn<AdPerformanceRow>[] = [
  { key: "name", header: "Plataforma", render: (r) => r.name, className: "font-semibold" },
  ...metricColumns,
];

const platformShort: Record<AdPerformanceRow["platform"], string> = {
  META: "Meta",
  GOOGLE: "Google",
  TIKTOK: "TikTok",
};

/** The hierarchy table: name, then the parents the level has, then the metrics. */
export function levelColumns(level: AdLevel): DataTableColumn<AdPerformanceRow>[] {
  const head: DataTableColumn<AdPerformanceRow>[] = [
    {
      key: "name",
      header: level === "campanha" ? "Campanha" : level === "conjunto" ? "Conjunto" : "Anúncio",
      render: (r) => r.name,
      sortValue: (r) => r.name,
      className: "whitespace-nowrap font-semibold",
    },
    {
      key: "platform",
      header: "Plataforma",
      render: (r) => platformShort[r.platform],
      sortValue: (r) => r.platform,
    },
  ];
  if (level !== "campanha") {
    head.push({
      key: "campaignName",
      header: "Campanha",
      render: (r) => r.campaignName ?? "—",
      sortValue: (r) => r.campaignName,
      className: "whitespace-nowrap",
    });
  }
  if (level === "anuncio") {
    head.push({
      key: "adsetName",
      header: "Conjunto",
      render: (r) => r.adsetName ?? "—",
      sortValue: (r) => r.adsetName,
      className: "whitespace-nowrap",
    });
  }
  return [...head, ...metricColumns];
}
