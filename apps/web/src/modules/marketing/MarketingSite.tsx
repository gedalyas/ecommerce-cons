import { explanationOf } from "@ecommerce/contracts/glossary";
import type {
  MarketingSearch,
  MarketingSiteTab,
  SiteKpi,
  SiteSeriesPoint,
} from "@ecommerce/contracts/marketing";
import type { PeriodSearch } from "@ecommerce/contracts/shared/period";
import { ComboChart } from "@/shared/ui/ComboChart";
import { DataTable } from "@/shared/ui/DataTable";
import { metricToTile } from "@/shared/ui/metricToTile";
import { MetricTileGroup } from "@/shared/ui/MetricTileGroup";
import { SectionBlock } from "@/shared/ui/SectionBlock";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { layout } from "@/shared/styles/spacing";
import { audienceColumns, pageColumns, regionColumns } from "./siteColumns";

type Props = {
  data: MarketingSiteTab;
  search: MarketingSearch;
  period: PeriodSearch;
  comparisonLabel: string;
  onPatch: (next: Partial<MarketingSearch>) => void;
};

const tiles: { key: SiteKpi; label: string; goodWhen?: "up" | "down" }[] = [
  { key: "sessions", label: "Sessões" },
  { key: "engagedSessions", label: "Sessões engajadas" },
  { key: "users", label: "Usuários" },
  { key: "newUsers", label: "Novos usuários" },
  { key: "pageViews", label: "Visualizações" },
  { key: "averageDuration", label: "Duração média" },
  { key: "engagementRate", label: "Taxa de engajamento" },
  { key: "bounceRate", label: "Taxa de rejeição", goodWhen: "down" },
];

const seriesOptions = [
  { key: "mensal", label: "Mensal" },
  { key: "diaria", label: "No período" },
] as const;

const pointsOf = (points: SiteSeriesPoint[], key: keyof Omit<SiteSeriesPoint, "bucket">) =>
  points.flatMap((p) => {
    const value = p[key];
    return value == null ? [] : [{ bucket: p.bucket, value }];
  });

function Charts({ data, search, period, onPatch }: Omit<Props, "comparisonLabel">) {
  const monthly = search.serie === "mensal";
  const points = monthly ? data.monthly : data.daily;
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
    <>
      <SectionBlock
        title="Sessões × engajamento"
        description="Todas as visitas, as engajadas e a taxa de engajamento."
        meta={picker}
      >
        <ComboChart
          bars={{ label: "Sessões", unit: "count", points: pointsOf(points, "sessions") }}
          extraBars={{
            label: "Sessões engajadas",
            unit: "count",
            points: pointsOf(points, "engagedSessions"),
          }}
          line={{
            label: "Taxa de engajamento",
            unit: "percent",
            points: pointsOf(points, "engagementRate"),
          }}
          granularity={granularity}
        />
      </SectionBlock>
      <SectionBlock
        title="Usuários × novos usuários"
        description="Quem visitou o site e quantos chegaram pela primeira vez."
        meta={picker}
      >
        <ComboChart
          bars={{ label: "Usuários", unit: "count", points: pointsOf(points, "users") }}
          extraBars={{
            label: "Novos usuários",
            unit: "count",
            points: pointsOf(points, "newUsers"),
          }}
          line={{ label: "% de novos", unit: "percent", points: pointsOf(points, "newUserShare") }}
          granularity={granularity}
        />
      </SectionBlock>
    </>
  );
}

function Audience({ data }: Pick<Props, "data">) {
  return (
    <SectionBlock
      title="Público"
      description="Sessões e compras contadas pelo Google Analytics por gênero e faixa etária. Compras informadas não são venda; a venda vem do ERP ou da planilha."
      bodyClassName={layout.cardPadding}
    >
      <div className={layout.groupStack}>
        <DataTable
          columns={audienceColumns("Gênero")}
          rows={data.gender}
          rowKey={(r) => r.value}
          emptyMessage="Sem dados de gênero no período."
        />
        <DataTable
          columns={audienceColumns("Faixa etária")}
          rows={data.age}
          rowKey={(r) => r.value}
          emptyMessage="Sem dados de faixa etária no período."
        />
      </div>
    </SectionBlock>
  );
}

export function MarketingSite({ data, search, period, comparisonLabel, onPatch }: Props) {
  const suffix = `${period.inicio}-${period.fim}`;
  return (
    <div className={layout.blockStack}>
      <MetricTileGroup
        metrics={tiles.map((t) =>
          metricToTile({
            label: t.label,
            metric: data.kpis[t.key],
            comparisonLabel,
            goodWhen: t.goodWhen ?? "up",
            hint: explanationOf(t.key),
          }),
        )}
      />
      <Charts data={data} search={search} period={period} onPatch={onPatch} />
      <Audience data={data} />
      <SectionBlock
        title="Páginas mais visitadas"
        description="As 50 páginas com mais visualizações no período."
      >
        <DataTable
          columns={pageColumns}
          rows={data.pages}
          rowKey={(r) => r.path}
          initialSort={{ key: "pageViews", direction: "desc" }}
          initialPageSize={10}
          csvFileName={`site-paginas-${suffix}`}
          emptyMessage="Sem páginas registradas no período."
        />
      </SectionBlock>
      <SectionBlock
        title="Regiões"
        description="Visitas e compras contadas pelo Google Analytics por estado."
      >
        <DataTable
          columns={regionColumns}
          rows={data.regions}
          rowKey={(r) => r.province}
          initialSort={{ key: "sessions", direction: "desc" }}
          initialPageSize={10}
          csvFileName={`site-regioes-${suffix}`}
          emptyMessage="Sem regiões registradas no período."
        />
      </SectionBlock>
    </div>
  );
}
