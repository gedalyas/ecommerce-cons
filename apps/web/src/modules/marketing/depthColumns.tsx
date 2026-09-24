import type { DataTableColumn, DataTableHeat } from "@/shared/ui/DataTable";
import { DepthNameCell } from "./DepthNameCell";
import { explanationOf } from "@ecommerce/contracts/glossary";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatVariation,
} from "@ecommerce/contracts/shared/format";
import { adLevelLabel, type AdDepthRow, type AdLevel } from "@ecommerce/contracts/marketing";

type NumericKey = {
  [K in keyof AdDepthRow]: AdDepthRow[K] extends number | null ? K : never;
}[keyof AdDepthRow];

type Format = "money" | "money2" | "count" | "percent" | "variation";

const formatters: Record<Format, (v: number) => string> = {
  money: (v) => formatCurrency(v),
  money2: (v) => formatCurrency(v, 2),
  count: (v) => formatNumber(v),
  percent: (v) => formatPercent(v),
  variation: (v) => formatVariation(v),
};

const round2 = (v: number | null) => (v == null ? null : Math.round(v * 100) / 100);

function numeric(
  key: NumericKey,
  header: string,
  format: Format,
  heat: DataTableHeat | null = null,
): DataTableColumn<AdDepthRow> {
  return {
    key,
    header,
    align: "right",
    render: (r) => (r[key] == null ? "—" : formatters[format](r[key])),
    csv: (r) => round2(r[key]),
    sortValue: (r) => r[key],
    hint: explanationOf(key),
    ...(heat ? { heat } : {}),
  };
}

const metricColumns: DataTableColumn<AdDepthRow>[] = [
  numeric("spend", "Investimento", "money"),
  numeric("impressions", "Impressões", "count"),
  numeric("reach", "Alcance", "count"),
  numeric("cpm", "CPM", "money2", "good-low"),
  numeric("linkClicks", "Cliques no link", "count"),
  numeric("ctr", "CTR", "percent", "good-high"),
  numeric("cpc", "CPC", "money2", "good-low"),
  numeric("landingPageViews", "Visualizações da página", "count"),
  numeric("addToCart", "Adições ao carrinho", "count"),
  numeric("conversions", "Conversões", "count", "good-high"),
  numeric("costPerConversion", "Custo por conversão", "money2", "good-low"),
  numeric("costPerConversionVariation", "Δ custo por conversão", "variation"),
  numeric("leads", "Leads", "count"),
  numeric("messages", "Conversas", "count"),
];

export function depthColumns(
  level: AdLevel,
  onDrill: (row: AdDepthRow) => void,
): DataTableColumn<AdDepthRow>[] {
  const head: DataTableColumn<AdDepthRow>[] = [
    {
      key: "name",
      header: adLevelLabel[level],
      render: (r) => <DepthNameCell row={r} level={level} onDrill={onDrill} />,
      renderTotal: (r) => r.name,
      csv: (r) => r.name,
      sortValue: (r) => r.name,
      className: "min-w-48 font-semibold",
      mobile: "title",
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
