import { Badge } from "@/shared/ui/Badge";
import { BarBreakdownChart } from "@/shared/ui/BarBreakdownChart";
import { ComboChart } from "@/shared/ui/ComboChart";
import { DataTable, type DataTableColumn } from "@/shared/ui/DataTable";
import { DonutBreakdown } from "@/shared/ui/DonutBreakdown";
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
  ChannelPerformanceRow,
  FunnelRatioRow,
  MarketingSummary,
  UtmSalesRow,
  BenchmarkVerdict,
} from "@ecommerce/contracts/marketing";
import {
  investmentMetricLabel,
  sessionMetricLabel,
  utmDimensionLabel,
  investmentMetrics,
  sessionMetrics,
  utmDimensions,
  type MarketingSearch,
} from "@ecommerce/contracts/marketing";

const money = (v: number | null) => (v == null ? "—" : formatCurrency(v));
const pct = (v: number | null) => (v == null ? "—" : formatPercent(v));
const times = (v: number | null) => (v == null ? "—" : formatMultiplier(v));

const channelColumns: DataTableColumn<ChannelPerformanceRow>[] = [
  { key: "label", header: "Canal", render: (r) => r.label, className: "font-semibold" },
  {
    key: "investment",
    header: "Investimento",
    align: "right",
    render: (r) => money(r.investment),
    csv: (r) => Math.round(r.investment * 100) / 100,
  },
  {
    key: "revenue",
    header: "Receita",
    mobile: "lead",
    align: "right",
    render: (r) => money(r.revenue),
    csv: (r) => Math.round(r.revenue * 100) / 100,
  },
  { key: "roi", header: "ROI", align: "right", render: (r) => pct(r.roi), csv: (r) => r.roi },
  { key: "roas", header: "ROAS", align: "right", render: (r) => times(r.roas), csv: (r) => r.roas },
  { key: "cpa", header: "CPA", align: "right", render: (r) => money(r.cpa), csv: (r) => r.cpa },
  {
    key: "conversionRate",
    header: "Conversão",
    align: "right",
    render: (r) => pct(r.conversionRate),
    csv: (r) => r.conversionRate,
  },
];

const verdictLabel: Record<BenchmarkVerdict, string> = {
  abaixo: "Abaixo",
  dentro: "Dentro",
  acima: "Acima",
};

const funnelColumns: DataTableColumn<FunnelRatioRow>[] = [
  { key: "label", header: "Etapa", render: (r) => r.label, className: "whitespace-nowrap" },
  {
    key: "value",
    header: "Período",
    align: "right",
    render: (r) => pct(r.value),
    csv: (r) => r.value,
  },
  {
    key: "average",
    header: "Média da loja",
    align: "right",
    render: (r) => pct(r.average),
    csv: (r) => r.average,
  },
  {
    key: "benchmark",
    header: "Referência de mercado",
    align: "right",
    render: (r) => `${formatPercent(r.benchmark.min)} a ${formatPercent(r.benchmark.max)}`,
    csv: (r) => `${r.benchmark.min}-${r.benchmark.max}`,
  },
  {
    key: "verdict",
    header: "Situação",
    align: "right",
    render: (r) =>
      r.verdict ? (
        <Badge
          tone={r.verdict === "abaixo" ? "warning" : r.verdict === "acima" ? "accent" : "muted"}
        >
          {verdictLabel[r.verdict]}
        </Badge>
      ) : (
        "—"
      ),
    csv: (r) => (r.verdict ? verdictLabel[r.verdict] : ""),
  },
];

const utmColumns: DataTableColumn<UtmSalesRow>[] = [
  { key: "label", header: "Dimensão", render: (r) => r.label, sortValue: (r) => r.label },
  {
    key: "orders",
    header: "Pedidos",
    align: "right",
    render: (r) => formatNumber(r.orders),
    csv: (r) => r.orders,
    sortValue: (r) => r.orders,
  },
  {
    key: "revenue",
    header: "Receita",
    mobile: "lead",
    align: "right",
    render: (r) => money(r.revenue),
    csv: (r) => Math.round(r.revenue * 100) / 100,
    sortValue: (r) => r.revenue,
  },
  {
    key: "share",
    header: "Participação",
    align: "right",
    render: (r) => pct(r.share),
    csv: (r) => r.share,
    sortValue: (r) => r.share,
  },
  {
    key: "aov",
    header: "Ticket médio",
    align: "right",
    render: (r) => money(r.aov),
    csv: (r) => Math.round(r.aov * 100) / 100,
    sortValue: (r) => r.aov,
  },
];

export function MarketingResumo({
  data,
  search,
  period,
  onPatch,
}: {
  data: MarketingSummary;
  search: MarketingSearch;
  period: PeriodSearch;
  onPatch: (next: Partial<MarketingSearch>) => void;
}) {
  const investMetric = investmentMetricLabel[search.metricaInvest];
  const sessionMetric = sessionMetricLabel[search.metricaSessoes];
  const suffix = `${period.inicio}-${period.fim}`;
  const total = data.channels.find((c) => c.key === "total");

  return (
    <>
      <SectionBlock
        title="Desempenho por canal"
        description="Investimento = mídia paga mais as regras de custo de vendas e marketing do período; os custos compartilhados são rateados pela receita."
        meta={
          <label className={cn(textClass.meta, "flex items-center gap-2 text-muted-foreground")}>
            <input
              type="checkbox"
              className="accent-primary"
              checked={search.incluirTaxa}
              onChange={(e) => onPatch({ incluirTaxa: e.target.checked })}
            />
            Incluir taxa da plataforma
          </label>
        }
      >
        <DataTable
          columns={channelColumns}
          rows={data.channels.filter((c) => c.key !== "total")}
          {...(total ? { totalRow: total } : {})}
          rowKey={(r) => r.key}
          csvFileName={`marketing-canais-${suffix}`}
        />
      </SectionBlock>

      <SectionBlock
        title="Investimento por categoria"
        description="Mídia por plataforma, taxa das plataformas e as regras de custo de vendas e marketing."
        bodyClassName={layout.cardPadding}
      >
        <DonutBreakdown
          slices={data.investmentBreakdown}
          unit="currency"
          totalLabel="investimento no período"
        />
      </SectionBlock>

      <SectionBlock
        title="Investimento × métrica"
        description="Barras de investimento em mídia contra a métrica escolhida, por período."
        meta={
          <SegmentedControl
            label="Métrica do investimento"
            options={investmentMetrics.map((key) => ({
              key,
              label: investmentMetricLabel[key].label,
            }))}
            value={search.metricaInvest}
            onChange={(metricaInvest) => onPatch({ metricaInvest })}
          />
        }
        bodyClassName={layout.cardPadding}
      >
        <ComboChart
          bars={{ label: "Investimento", unit: "currency", points: data.investmentSeries }}
          line={{
            label: investMetric.label,
            unit: investMetric.unit,
            points: data.investmentMetricSeries,
          }}
          granularity={period.por}
        />
      </SectionBlock>

      <SectionBlock
        title="Sessões × métrica"
        description="Tráfego do site contra a métrica escolhida, por período."
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl
              label="Base do tráfego"
              options={[
                { key: "sessoes", label: "Sessões" },
                { key: "usuarios", label: "Usuários" },
              ]}
              value={search.base}
              onChange={(base) => onPatch({ base })}
            />
            <SegmentedControl
              label="Métrica das sessões"
              options={sessionMetrics.map((key) => ({
                key,
                label: sessionMetricLabel[key].label,
              }))}
              value={search.metricaSessoes}
              onChange={(metricaSessoes) => onPatch({ metricaSessoes })}
            />
          </div>
        }
        bodyClassName={layout.cardPadding}
      >
        <ComboChart
          bars={{
            label: search.base === "usuarios" ? "Usuários" : "Sessões",
            unit: "count",
            points: data.sessionsSeries,
          }}
          line={{
            label: sessionMetric.label,
            unit: sessionMetric.unit,
            points: data.sessionsMetricSeries,
          }}
          granularity={period.por}
        />
      </SectionBlock>

      <SectionBlock
        title="Funil de conversão"
        description="Das sessões aos pedidos pagos da loja própria; marketplaces não têm sessões."
        bodyClassName={layout.cardPadding}
      >
        <BarBreakdownChart
          items={data.funnel.steps.map((s) => ({ key: s.key, label: s.label, value: s.value }))}
          unit="count"
        />
      </SectionBlock>

      <SectionBlock
        title="Taxas de conversão"
        description="Período contra a média histórica da loja e a faixa de referência do mercado."
      >
        <DataTable
          columns={funnelColumns}
          rows={data.funnel.ratios}
          rowKey={(r) => r.key}
          csvFileName={`marketing-funil-${suffix}`}
        />
      </SectionBlock>

      <SectionBlock
        title="Vendas por UTM"
        description="Pedidos pagos atribuídos pela dimensão escolhida; marketplaces aparecem pelo canal."
        meta={
          <SegmentedControl
            label="Dimensão de UTM"
            options={utmDimensions.map((key) => ({ key, label: utmDimensionLabel[key] }))}
            value={search.utm}
            onChange={(utm) => onPatch({ utm })}
          />
        }
      >
        <DataTable
          columns={utmColumns}
          rows={data.utmSales}
          rowKey={(r) => r.key}
          initialSort={{ key: "revenue", direction: "desc" }}
          csvFileName={`marketing-utm-${search.utm}-${suffix}`}
        />
      </SectionBlock>
    </>
  );
}
