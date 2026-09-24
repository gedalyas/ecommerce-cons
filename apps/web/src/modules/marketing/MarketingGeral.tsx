import { explanationOf } from "@ecommerce/contracts/glossary";
import type {
  MarketingGeneral,
  MarketingSearch,
  PlatformCard,
  SalesInvestmentPoint,
  TrafficPoint,
} from "@ecommerce/contracts/marketing";
import { formatDate } from "@ecommerce/contracts/shared/format";
import { formatMetric } from "@ecommerce/contracts/shared/metricFormat";
import type { PeriodSearch } from "@ecommerce/contracts/shared/period";
import { ComboChart } from "@/shared/ui/ComboChart";
import { metricToTile } from "@/shared/ui/metricToTile";
import { MetricTileGroup } from "@/shared/ui/MetricTileGroup";
import { SectionBlock } from "@/shared/ui/SectionBlock";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { layout } from "@/shared/styles/spacing";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { FunnelSteps } from "./FunnelSteps";

type Props = {
  data: MarketingGeneral;
  search: MarketingSearch;
  period: PeriodSearch;
  comparisonLabel: string;
  onPatch: (next: Partial<MarketingSearch>) => void;
};

const seriesOptions = [
  { key: "mensal", label: "Mensal" },
  { key: "diaria", label: "No período" },
] as const;

const salesSeries = (points: SalesInvestmentPoint[]) => ({
  sold: points.map((p) => ({ bucket: p.bucket, value: p.sold })),
  invested: points.map((p) => ({ bucket: p.bucket, value: p.invested })),
  roas: points.flatMap((p) => (p.roas == null ? [] : [{ bucket: p.bucket, value: p.roas }])),
});

const trafficSeries = (points: TrafficPoint[]) => ({
  sessions: points.map((p) => ({ bucket: p.bucket, value: p.sessions })),
  newUsers: points.map((p) => ({ bucket: p.bucket, value: p.newUsers })),
  conversion: points.flatMap((p) =>
    p.conversionRate == null ? [] : [{ bucket: p.bucket, value: p.conversionRate }],
  ),
});

function Kpis({ data, comparisonLabel }: Pick<Props, "data" | "comparisonLabel">) {
  const k = data.kpis;
  const tile = (
    label: string,
    metric: typeof k.sold,
    term: string,
    goodWhen: "up" | "down" = "up",
  ) => metricToTile({ label, metric, comparisonLabel, goodWhen, hint: explanationOf(term) });
  return (
    <MetricTileGroup
      metrics={[
        tile("Vendido", k.sold, "totalSold"),
        tile("Investido", k.invested, "adSpend", "down"),
        tile("ROAS do site", k.roas, "roas"),
        tile("MER", k.mer, "mer"),
        tile("Pedidos", k.orders, "orders"),
        tile("Ticket médio", k.aov, "averageTicket"),
        tile("Conversão", k.conversionRate, "conversionRate"),
        tile("Sessões", k.sessions, "sessions"),
      ]}
    />
  );
}

function YearAndProjection({ data }: Pick<Props, "data">) {
  const month = formatDate(`${data.projection.month}-01T00:00:00`, { month: "long" });
  const money = (v: number | null) => formatMetric(v, "currency");
  return (
    <SectionBlock
      title="Ano e projeção do mês"
      description="O acumulado do ano e o ritmo do mês levado até o último dia."
    >
      <MetricTileGroup
        bare
        metrics={[
          {
            label: "Vendido no ano",
            value: money(data.year.sold),
            subNote: `${money(data.year.invested)} investidos`,
          },
          { label: "ROAS do site no ano", value: formatMetric(data.year.roas, "multiplier") },
          {
            label: "Vendido projetado",
            value: money(data.projection.sold),
            subNote: `até o fim de ${month}`,
          },
          {
            label: "Investido projetado",
            value: money(data.projection.invested),
            subNote: `até o fim de ${month}`,
          },
        ]}
      />
    </SectionBlock>
  );
}

function PlatformCards({
  platforms,
  comparisonLabel,
}: {
  platforms: PlatformCard[];
  comparisonLabel: string;
}) {
  if (platforms.length === 0) {
    return (
      <SectionBlock
        title="Mídia por plataforma"
        description="Nenhuma plataforma de anúncios com investimento no período."
      >
        <p className={cn(textClass.body, "text-muted-foreground")}>—</p>
      </SectionBlock>
    );
  }
  return (
    <SectionBlock
      title="Mídia por plataforma"
      bodyClassName={layout.cardPadding}
      description="Investimento e eficiência de cada plataforma. Conversões são as informadas pela plataforma; venda vem só do ERP ou da planilha."
    >
      <div className={layout.groupStack}>
        {platforms.map((p) => (
          <div key={p.platform} className="flex flex-col gap-2">
            <p className={cn(textClass.label, "text-muted-foreground")}>{p.label}</p>
            <MetricTileGroup
              bare
              metrics={[
                metricToTile({
                  label: "Investido",
                  metric: p.spend,
                  comparisonLabel,
                  goodWhen: "down",
                }),
                metricToTile({ label: "CPC", metric: p.cpc, comparisonLabel, goodWhen: "down" }),
                metricToTile({
                  label: "Conversões informadas",
                  metric: p.conversions,
                  comparisonLabel,
                }),
                metricToTile({
                  label: "Custo por conversão",
                  metric: p.costPerConversion,
                  comparisonLabel,
                  goodWhen: "down",
                }),
              ]}
            />
          </div>
        ))}
      </div>
    </SectionBlock>
  );
}

export function MarketingGeral({ data, search, period, comparisonLabel, onPatch }: Props) {
  const monthly = search.serie === "mensal";
  const sales = salesSeries(monthly ? data.monthly : data.daily);
  const traffic = trafficSeries(monthly ? data.trafficMonthly : data.trafficDaily);
  const granularity = monthly ? "mes" : period.por;
  const picker = (
    <SegmentedControl
      options={seriesOptions}
      value={search.serie}
      onChange={(serie) => onPatch({ serie })}
      label="Série"
    />
  );
  return (
    <div className={layout.blockStack}>
      <Kpis data={data} comparisonLabel={comparisonLabel} />
      <YearAndProjection data={data} />
      <SectionBlock
        title="Vendido × investido"
        description="Vendas do ERP ou da planilha, investimento em anúncios e o ROAS do site."
        meta={picker}
      >
        <ComboChart
          bars={{ label: "Vendido", unit: "currency", points: sales.sold }}
          extraBars={{ label: "Investido", unit: "currency", points: sales.invested }}
          line={{ label: "ROAS do site", unit: "multiplier", points: sales.roas }}
          granularity={granularity}
        />
      </SectionBlock>
      <SectionBlock
        title="Sessões × taxa de conversão"
        description="Sessões e novos usuários do site com a conversão em pedidos."
        meta={picker}
      >
        <ComboChart
          bars={{ label: "Sessões", unit: "count", points: traffic.sessions }}
          extraBars={{ label: "Novos usuários", unit: "count", points: traffic.newUsers }}
          line={{ label: "Taxa de conversão", unit: "percent", points: traffic.conversion }}
          granularity={granularity}
        />
      </SectionBlock>
      <SectionBlock
        title="Funil do site"
        bodyClassName={layout.cardPadding}
        description={`Do acesso ao pedido pago, com a variação ${comparisonLabel}.`}
      >
        <FunnelSteps steps={data.funnel} />
      </SectionBlock>
      <PlatformCards platforms={data.platforms} comparisonLabel={comparisonLabel} />
    </div>
  );
}
