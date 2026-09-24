import { explanationOf } from "@ecommerce/contracts/glossary";
import {
  adLevelLabel,
  adLevels,
  adPlatformLabel,
  type AdDepthRow,
  type MarketingPlatformTab,
  type MarketingSearch,
  type PlatformKpi,
  type PlatformSeriesPoint,
} from "@ecommerce/contracts/marketing";
import type { PeriodSearch } from "@ecommerce/contracts/shared/period";
import { Button } from "@/shared/ui/Button";
import { ComboChart } from "@/shared/ui/ComboChart";
import { DataTable } from "@/shared/ui/DataTable";
import { metricToTile } from "@/shared/ui/metricToTile";
import { MetricTileGroup } from "@/shared/ui/MetricTileGroup";
import { SectionBlock } from "@/shared/ui/SectionBlock";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/Select";
import { layout } from "@/shared/styles/spacing";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { depthColumns } from "./depthColumns";

type Props = {
  data: MarketingPlatformTab;
  search: MarketingSearch;
  period: PeriodSearch;
  comparisonLabel: string;
  onPatch: (next: Partial<MarketingSearch>) => void;
};

type Tile = { key: PlatformKpi; label: string; goodWhen?: "up" | "down" };

const headlineTiles: Tile[] = [
  { key: "spend", label: "Investido", goodWhen: "down" },
  { key: "reach", label: "Alcance" },
  { key: "cpm", label: "CPM", goodWhen: "down" },
  { key: "ctr", label: "CTR" },
  { key: "cpc", label: "CPC", goodWhen: "down" },
  { key: "conversions", label: "Conversões" },
  { key: "costPerConversion", label: "Custo por conversão", goodWhen: "down" },
  { key: "costPerSession", label: "Custo por sessão", goodWhen: "down" },
];

const pathTiles: Tile[] = [
  { key: "impressions", label: "Impressões" },
  { key: "linkClicks", label: "Cliques no link" },
  { key: "landingPageViews", label: "Visualizações da página" },
  { key: "sessions", label: "Sessões pagas" },
  { key: "addToCart", label: "Adições ao carrinho" },
];

const contactTiles: Tile[] = [
  { key: "leads", label: "Leads" },
  { key: "messages", label: "Conversas iniciadas" },
  { key: "costPerLead", label: "Custo por lead", goodWhen: "down" },
];

const seriesOptions = [
  { key: "mensal", label: "Mensal" },
  { key: "diaria", label: "No período" },
] as const;

const pointsOf = (points: PlatformSeriesPoint[], key: keyof Omit<PlatformSeriesPoint, "bucket">) =>
  points.flatMap((p) => {
    const value = p[key];
    return value == null ? [] : [{ bucket: p.bucket, value }];
  });

function Tiles({
  data,
  tiles,
  comparisonLabel,
  bare = false,
}: Pick<Props, "data" | "comparisonLabel"> & { tiles: Tile[]; bare?: boolean }) {
  return (
    <MetricTileGroup
      bare={bare}
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
  );
}

function AccountFilter({ data, search, onPatch }: Pick<Props, "data" | "search" | "onPatch">) {
  if (data.accounts.length < 2) return null;
  return (
    <Select
      value={search.conta}
      onValueChange={(conta) => onPatch({ conta, campanha: null, conjunto: null })}
    >
      <SelectTrigger className="w-full sm:w-72" aria-label="Conta de anúncios">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="todas">Todas as contas</SelectItem>
        {data.accounts.map((a) => (
          <SelectItem key={a.id} value={a.id}>
            {a.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

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
        title="Investido × custo por conversão"
        description="Quanto foi investido e quanto custou cada conversão informada pela plataforma."
        meta={picker}
      >
        <ComboChart
          bars={{ label: "Investido", unit: "currency", points: pointsOf(points, "spend") }}
          line={{
            label: "Custo por conversão",
            unit: "currency",
            points: pointsOf(points, "costPerConversion"),
          }}
          granularity={granularity}
        />
      </SectionBlock>
      <SectionBlock
        title="Sessões pagas × custo por sessão"
        description="Visitas ao site vindas dos anúncios desta plataforma, segundo o Google Analytics."
        meta={picker}
      >
        <ComboChart
          bars={{ label: "Sessões pagas", unit: "count", points: pointsOf(points, "sessions") }}
          line={{
            label: "Custo por sessão",
            unit: "currency",
            points: pointsOf(points, "costPerSession"),
          }}
          granularity={granularity}
        />
      </SectionBlock>
    </>
  );
}

function drillPatch(search: MarketingSearch, row: AdDepthRow): Partial<MarketingSearch> {
  return search.nivel === "campanha"
    ? { campanha: row.campaignId, conjunto: null, nivel: "conjunto" }
    : { campanha: row.campaignId, conjunto: row.adsetId ?? row.id, nivel: "anuncio" };
}

function Scope({ data, search, onPatch }: Pick<Props, "data" | "search" | "onPatch">) {
  if (!search.campanha && !search.conjunto) return null;
  const [first] = data.rows;
  const parts = [
    search.campanha ? `Campanha: ${first?.campaignName ?? "—"}` : null,
    search.conjunto ? `Conjunto: ${first?.adsetName ?? "—"}` : null,
  ].filter(Boolean);
  return (
    <div className="flex flex-wrap items-center gap-2 px-4 pt-4">
      <p className={cn(textClass.meta, "text-muted-foreground")}>{parts.join(" · ")}</p>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPatch({ campanha: null, conjunto: null, nivel: "campanha" })}
      >
        Ver todas as campanhas
      </Button>
    </div>
  );
}

function LevelTable({ data, search, period, onPatch }: Omit<Props, "comparisonLabel">) {
  return (
    <SectionBlock
      title={adLevelLabel[search.nivel]}
      description="Clique numa campanha ou conjunto para abrir o nível de baixo. As cores marcam o melhor e o pior custo de cada coluna."
      meta={
        <SegmentedControl
          label="Nível"
          options={adLevels.map((key) => ({ key, label: adLevelLabel[key] }))}
          value={search.nivel}
          onChange={(nivel) => onPatch({ nivel })}
        />
      }
    >
      <Scope data={data} search={search} onPatch={onPatch} />
      <DataTable
        columns={depthColumns(search.nivel, (row) => onPatch(drillPatch(search, row)))}
        rows={data.rows}
        totalRow={data.total}
        rowKey={(r) => r.key}
        initialSort={{ key: "spend", direction: "desc" }}
        initialPageSize={10}
        csvFileName={`${data.platform.toLowerCase()}-${search.nivel}-${period.inicio}-${period.fim}`}
        emptyMessage="Sem anúncios desta plataforma no período."
      />
    </SectionBlock>
  );
}

export function MarketingPlataforma({ data, search, period, comparisonLabel, onPatch }: Props) {
  const label = adPlatformLabel[data.platform];
  return (
    <div className={layout.blockStack}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={cn(textClass.body, "text-muted-foreground")}>
          Dados da conta de anúncios {label}. Conversões são as que a plataforma informa; a venda da
          loja vem do ERP ou da planilha.
        </p>
        <AccountFilter data={data} search={search} onPatch={onPatch} />
      </div>
      <Tiles data={data} tiles={headlineTiles} comparisonLabel={comparisonLabel} />
      <Charts data={data} search={search} period={period} onPatch={onPatch} />
      <SectionBlock
        title="Do anúncio ao carrinho"
        description="Cada etapa entre a impressão e a adição ao carrinho."
        bodyClassName={layout.cardPadding}
      >
        <Tiles data={data} tiles={pathTiles} comparisonLabel={comparisonLabel} bare />
      </SectionBlock>
      <SectionBlock
        title="Leads e conversas"
        description="Campanhas de cadastro e de mensagens, que não geram venda direta."
        bodyClassName={layout.cardPadding}
      >
        <Tiles data={data} tiles={contactTiles} comparisonLabel={comparisonLabel} bare />
      </SectionBlock>
      <LevelTable data={data} search={search} period={period} onPatch={onPatch} />
    </div>
  );
}
