import type { DataTableColumn } from "@/shared/ui/DataTable";
import { DataTable } from "@/shared/ui/DataTable";
import { SectionBlock } from "@/shared/ui/SectionBlock";
import { explanationOf } from "@ecommerce/contracts/glossary";
import type { MarketingSalesChannels, SalesChannelRow } from "@ecommerce/contracts/marketing";
import {
  formatCurrency,
  formatMultiplier,
  formatNumber,
  formatPercent,
  formatVariation,
} from "@ecommerce/contracts/shared/format";
import type { PeriodSearch } from "@ecommerce/contracts/shared/period";

type NumericKey = {
  [K in keyof SalesChannelRow]: SalesChannelRow[K] extends number | null ? K : never;
}[keyof SalesChannelRow];

const formatters = {
  money: (v: number) => formatCurrency(v),
  count: (v: number) => formatNumber(v),
  percent: (v: number) => formatPercent(v, 2),
  share: (v: number) => formatPercent(v),
  variation: (v: number) => formatVariation(v),
  multiplier: (v: number) => formatMultiplier(v),
};

const round2 = (v: number | null) => (v == null ? null : Math.round(v * 100) / 100);

function numeric(
  key: NumericKey,
  header: string,
  format: keyof typeof formatters,
  term: string | null = null,
): DataTableColumn<SalesChannelRow> {
  return {
    key,
    header,
    align: "right",
    render: (r) => (r[key] == null ? "—" : formatters[format](r[key])),
    csv: (r) => round2(r[key]),
    sortValue: (r) => r[key],
    hint: term ? explanationOf(term) : null,
  };
}

const columns: DataTableColumn<SalesChannelRow>[] = [
  {
    key: "label",
    header: "Canal",
    render: (r) => r.label,
    sortValue: (r) => r.label,
    className: "font-semibold",
    mobile: "title",
  },
  numeric("revenue", "Vendido", "money", "totalSold"),
  numeric("revenueVariation", "Δ vendido", "variation"),
  numeric("share", "Participação", "share"),
  numeric("orders", "Pedidos", "count", "orders"),
  numeric("aov", "Ticket médio", "money", "averageTicket"),
  numeric("aovVariation", "Δ ticket", "variation"),
  numeric("sessions", "Sessões", "count", "sessions"),
  numeric("conversionRate", "Conversão", "percent", "conversionRate"),
  numeric("conversionVariation", "Δ conversão", "variation"),
  numeric("investment", "Investimento", "money", "adSpend"),
  numeric("roas", "ROAS do canal", "multiplier", "roas"),
];

export function MarketingCanais({
  data,
  period,
}: {
  data: MarketingSalesChannels;
  period: PeriodSearch;
}) {
  return (
    <SectionBlock
      title="Vendas por canal"
      description="Vendas do ERP ou da planilha em cada canal, com a variação do período de comparação. Sessões e conversão só existem para o site; o investimento em Meta, Google e TikTok vai para o site. Use o filtro de período no topo para ver 7, 14, 30 ou 90 dias."
    >
      <DataTable
        columns={columns}
        rows={data.rows}
        totalRow={data.total}
        rowKey={(r) => r.key}
        initialSort={{ key: "revenue", direction: "desc" }}
        csvFileName={`vendas-por-canal-${period.inicio}-${period.fim}`}
        emptyMessage="Sem vendas no período."
      />
    </SectionBlock>
  );
}
