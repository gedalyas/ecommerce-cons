import type { DataTableColumn } from "@/shared/ui/DataTable";
import { explanationOf } from "@ecommerce/contracts/glossary";
import { formatCurrency, formatNumber, formatPercent } from "@ecommerce/contracts/shared/format";
import { matchTypeLabelOf, type AdKeywordRow } from "@ecommerce/contracts/marketing";

const dash = (v: number | null, format: (v: number) => string) => (v == null ? "—" : format(v));
const round2 = (v: number | null) => (v == null ? null : Math.round(v * 100) / 100);

const text = (
  key: "keyword" | "adGroupName" | "campaignName",
  header: string,
): DataTableColumn<AdKeywordRow> => ({
  key,
  header,
  render: (r) => r[key],
  sortValue: (r) => r[key],
  className: "whitespace-nowrap",
});

export const keywordColumns: DataTableColumn<AdKeywordRow>[] = [
  { ...text("keyword", "Palavra-chave"), className: "min-w-40 font-semibold", mobile: "title" },
  {
    key: "matchType",
    header: "Correspondência",
    render: (r) => matchTypeLabelOf(r.matchType),
    csv: (r) => matchTypeLabelOf(r.matchType),
    sortValue: (r) => r.matchType,
  },
  text("adGroupName", "Grupo"),
  text("campaignName", "Campanha"),
  {
    key: "spend",
    header: "Investimento",
    align: "right",
    render: (r) => formatCurrency(r.spend),
    csv: (r) => round2(r.spend),
    sortValue: (r) => r.spend,
    hint: explanationOf("spend"),
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
    key: "clicks",
    header: "Cliques",
    align: "right",
    render: (r) => formatNumber(r.clicks),
    csv: (r) => r.clicks,
    sortValue: (r) => r.clicks,
  },
  {
    key: "ctr",
    header: "CTR",
    align: "right",
    render: (r) => dash(r.ctr, (v) => formatPercent(v)),
    csv: (r) => round2(r.ctr),
    sortValue: (r) => r.ctr,
    hint: explanationOf("ctr"),
    heat: "good-high",
  },
  {
    key: "cpc",
    header: "CPC",
    align: "right",
    render: (r) => dash(r.cpc, (v) => formatCurrency(v, 2)),
    csv: (r) => round2(r.cpc),
    sortValue: (r) => r.cpc,
    hint: explanationOf("cpc"),
    heat: "good-low",
  },
  {
    key: "conversions",
    header: "Conversões",
    align: "right",
    render: (r) => formatNumber(r.conversions),
    csv: (r) => r.conversions,
    sortValue: (r) => r.conversions,
    heat: "good-high",
  },
  {
    key: "costPerConversion",
    header: "Custo por conversão",
    align: "right",
    render: (r) => dash(r.costPerConversion, (v) => formatCurrency(v, 2)),
    csv: (r) => round2(r.costPerConversion),
    sortValue: (r) => r.costPerConversion,
    hint: explanationOf("costPerConversion"),
    heat: "good-low",
  },
];
