import type { DataTableColumn, DataTableHeat } from "@/shared/ui/DataTable";
import { DepthNameCell } from "./DepthNameCell";
import { explanationOf } from "@ecommerce/contracts/glossary";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatMultiplier,
  formatVariation,
} from "@ecommerce/contracts/shared/format";
import {
  adsetNounOf,
  campaignTypeLabelOf,
  platformLevelLabel,
  type AdDepthRow,
  type AdLevel,
  type AdPlatform,
} from "@ecommerce/contracts/marketing";

type NumericKey = {
  [K in keyof AdDepthRow]: AdDepthRow[K] extends number | null ? K : never;
}[keyof AdDepthRow];

type Format = "money" | "money2" | "count" | "percent" | "variation" | "multiplier";

const formatters: Record<Format, (v: number) => string> = {
  money: (v) => formatCurrency(v),
  money2: (v) => formatCurrency(v, 2),
  count: (v) => formatNumber(v),
  percent: (v) => formatPercent(v),
  variation: (v) => formatVariation(v),
  multiplier: (v) => formatMultiplier(v),
};

const glossaryTermOf: Partial<Record<NumericKey, string>> = {
  roas: "platformRoas",
  attributedRevenue: "platformRevenue",
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
    hint: explanationOf(glossaryTermOf[key] ?? key),
    ...(heat ? { heat } : {}),
  };
}

const metaColumns: DataTableColumn<AdDepthRow>[] = [
  numeric("spend", "Investimento", "money"),
  numeric("attributedRevenue", "Vendas informadas", "money"),
  numeric("roas", "ROAS da plataforma", "multiplier", "good-high"),
  numeric("impressions", "Impressões", "count"),
  numeric("reach", "Alcance", "count"),
  numeric("cpm", "CPM", "money2", "good-low"),
  numeric("linkClicks", "Cliques no link", "count"),
  numeric("ctr", "CTR", "percent", "good-high"),
  numeric("cpc", "CPC", "money2", "good-low"),
  numeric("landingPageViews", "Visualizações da página", "count"),
  numeric("addToCart", "Adições ao carrinho", "count"),
  numeric("conversions", "Conversões", "count", "good-high"),
  numeric("conversionsVariation", "Δ conversões", "variation"),
  numeric("costPerConversion", "Custo por conversão", "money2", "good-low"),
  numeric("costPerConversionVariation", "Δ custo por conversão", "variation"),
  numeric("leads", "Leads", "count"),
  numeric("messages", "Conversas", "count"),
];

const googleColumns: DataTableColumn<AdDepthRow>[] = [
  numeric("spend", "Investimento", "money"),
  numeric("attributedRevenue", "Vendas informadas", "money"),
  numeric("roas", "ROAS da plataforma", "multiplier", "good-high"),
  numeric("spendVariation", "Δ investimento", "variation"),
  numeric("impressions", "Impressões", "count"),
  numeric("impressionShare", "Parcela de impressões", "percent", "good-high"),
  numeric("clicks", "Cliques", "count"),
  numeric("ctr", "CTR", "percent", "good-high"),
  numeric("cpc", "CPC", "money2", "good-low"),
  numeric("conversions", "Conversões", "count", "good-high"),
  numeric("conversionsVariation", "Δ conversões", "variation"),
  numeric("costPerConversion", "Custo por conversão", "money2", "good-low"),
  numeric("costPerConversionVariation", "Δ custo por conversão", "variation"),
];

const metricColumnsOf: Record<AdPlatform, DataTableColumn<AdDepthRow>[]> = {
  META: metaColumns,
  GOOGLE: googleColumns,
  TIKTOK: metaColumns,
};

function contextColumns(platform: AdPlatform, level: AdLevel): DataTableColumn<AdDepthRow>[] {
  const columns: DataTableColumn<AdDepthRow>[] = [];
  if (level === "campanha") {
    columns.push({
      key: "campaignType",
      header: "Tipo",
      render: (r) => campaignTypeLabelOf(r.campaignType),
      csv: (r) => campaignTypeLabelOf(r.campaignType),
      sortValue: (r) => r.campaignType,
      className: "whitespace-nowrap",
    });
  }
  if (level !== "campanha") {
    columns.push({
      key: "campaignName",
      header: "Campanha",
      render: (r) => r.campaignName ?? "—",
      sortValue: (r) => r.campaignName,
      className: "whitespace-nowrap",
    });
  }
  if (level === "anuncio") {
    columns.push({
      key: "adsetName",
      header: adsetNounOf(platform),
      render: (r) => r.adsetName ?? "—",
      sortValue: (r) => r.adsetName,
      className: "whitespace-nowrap",
    });
  }
  return columns;
}

export function depthColumns(
  platform: AdPlatform,
  level: AdLevel,
  onDrill: (row: AdDepthRow) => void,
): DataTableColumn<AdDepthRow>[] {
  const name: DataTableColumn<AdDepthRow> = {
    key: "name",
    header: platformLevelLabel(platform, level),
    render: (r) => <DepthNameCell row={r} level={level} onDrill={onDrill} />,
    renderTotal: (r) => r.name,
    csv: (r) => r.name,
    sortValue: (r) => r.name,
    className: "min-w-48 font-semibold",
    mobile: "title",
  };
  return [name, ...contextColumns(platform, level), ...metricColumnsOf[platform]];
}
