import { explanationOf } from "@ecommerce/contracts/glossary";
import {
  adPlatformLabel,
  adPlatforms,
  stageKeyLabel,
  type AdPlatform,
  type CpaSeriesPoint,
  type InvestmentFunnelSummary,
  type MarketingSearch,
  type StageSeriesPoint,
  type StageSpend,
} from "@ecommerce/contracts/marketing";
import { formatCurrency, formatPercent } from "@ecommerce/contracts/shared/format";
import type { PeriodSearch } from "@ecommerce/contracts/shared/period";
import { DataTable, type DataTableColumn } from "@/shared/ui/DataTable";
import { metricToTile } from "@/shared/ui/metricToTile";
import { MetricTileGroup } from "@/shared/ui/MetricTileGroup";
import { MultiSeriesChart, type MultiSeries } from "@/shared/ui/MultiSeriesChart";
import { SectionBlock } from "@/shared/ui/SectionBlock";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { CreativesByStage } from "./CreativesByStage";
import { visibleStages } from "./funnelStages";

type Props = {
  summary: InvestmentFunnelSummary;
  search: MarketingSearch;
  period: PeriodSearch;
  comparisonLabel: string;
  onPatch: (next: Partial<MarketingSearch>) => void;
};

const seriesOptions = [
  { key: "mensal", label: "Mensal" },
  { key: "diaria", label: "No período" },
] as const;

const shareNote = (share: number | null) =>
  share == null ? "sem investimento" : `${formatPercent(share)} do total`;

function Tiles({ summary, comparisonLabel }: Pick<Props, "summary" | "comparisonLabel">) {
  return (
    <MetricTileGroup
      metrics={[
        metricToTile({
          label: "Investimento total",
          metric: summary.total,
          comparisonLabel,
          goodWhen: "down",
          hint: explanationOf("adSpend"),
        }),
        ...visibleStages(summary.stages).map((s) => ({
          ...metricToTile({
            label: stageKeyLabel[s.stage],
            metric: s.spend,
            comparisonLabel,
            goodWhen: "down",
          }),
          subNote: shareNote(s.share),
        })),
      ]}
    />
  );
}

const platformCell = (s: StageSpend, platform: (typeof adPlatforms)[number]) => {
  const cell = s.byPlatform.find((p) => p.platform === platform);
  if (!cell || cell.spend === 0) return "—";
  return `${formatCurrency(cell.spend)} · ${formatPercent(cell.share ?? 0)}`;
};

const stageColumns: DataTableColumn<StageSpend>[] = [
  {
    key: "stage",
    header: "Etapa",
    render: (r) => stageKeyLabel[r.stage],
    className: "font-semibold",
    mobile: "title",
  },
  ...adPlatforms.map((platform): DataTableColumn<StageSpend> => ({
    key: platform,
    header: adPlatformLabel[platform],
    align: "right",
    render: (r) => platformCell(r, platform),
    sortValue: (r) => r.byPlatform.find((p) => p.platform === platform)?.spend ?? 0,
  })),
  {
    key: "spend",
    header: "Total da etapa",
    align: "right",
    render: (r) => formatCurrency(r.spend.value ?? 0),
    sortValue: (r) => r.spend.value,
  },
  {
    key: "share",
    header: "Participação",
    align: "right",
    render: (r) => (r.share == null ? "—" : formatPercent(r.share)),
    sortValue: (r) => r.share,
  },
];

const stageLines = (summary: InvestmentFunnelSummary, points: StageSeriesPoint[]): MultiSeries[] =>
  visibleStages(summary.stages).map((s) => ({
    key: s.stage,
    label: stageKeyLabel[s.stage],
    points: points.map((p) => ({ bucket: p.bucket, value: p[s.stage] })),
  }));

const cpaPlatforms: readonly AdPlatform[] = ["META", "GOOGLE"];

const cpaLine = (
  key: keyof Omit<CpaSeriesPoint, "bucket">,
  label: string,
  points: CpaSeriesPoint[],
): MultiSeries => ({
  key,
  label,
  points: points.flatMap((p) => {
    const value = p[key];
    return value == null ? [] : [{ bucket: p.bucket, value }];
  }),
});

const cpaLines = (summary: InvestmentFunnelSummary, points: CpaSeriesPoint[]): MultiSeries[] => [
  cpaLine("site", "Site (pedidos do ERP)", points),
  ...summary.platforms
    .filter((p) => cpaPlatforms.includes(p.platform) && (p.spend.value ?? 0) > 0)
    .map((p) =>
      cpaLine(p.platform, `${adPlatformLabel[p.platform]} (conversões informadas)`, points),
    ),
];

export function FunnelSummary({ summary, search, period, comparisonLabel, onPatch }: Props) {
  const monthly = search.serie === "mensal";
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
      <Tiles summary={summary} comparisonLabel={comparisonLabel} />
      <SectionBlock
        title="Etapas por plataforma"
        description="Quanto cada plataforma investiu em cada etapa e o peso dela dentro da etapa."
      >
        <DataTable
          columns={stageColumns}
          rows={visibleStages(summary.stages)}
          rowKey={(r) => r.stage}
        />
      </SectionBlock>
      <SectionBlock
        title="Investimento por etapa"
        description="Topo, meio e fundo ao longo do tempo."
        meta={picker}
      >
        <MultiSeriesChart
          series={stageLines(summary, monthly ? summary.monthly : summary.daily)}
          unit="currency"
          granularity={granularity}
        />
      </SectionBlock>
      <SectionBlock
        title="Custo por pedido: site × Meta × Google"
        description="No site, o investimento que vai para o site dividido pelos pedidos do ERP ou da planilha; na Meta e no Google, o investimento dividido pelas conversões que cada um informa."
        meta={picker}
      >
        <MultiSeriesChart
          series={cpaLines(summary, monthly ? summary.cpaMonthly : summary.cpaDaily)}
          unit="currency"
          granularity={granularity}
        />
      </SectionBlock>
      <CreativesByStage stages={summary.creatives} />
    </>
  );
}
