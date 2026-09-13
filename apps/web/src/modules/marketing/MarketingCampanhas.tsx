import { DataTable } from "@/shared/ui/DataTable";
import { MultiSeriesChart } from "@/shared/ui/MultiSeriesChart";
import { SectionBlock } from "@/shared/ui/SectionBlock";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { layout } from "@/shared/styles/spacing";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { formatCurrency, formatMultiplier } from "@ecommerce/contracts/shared/format";
import type { PeriodSearch } from "@ecommerce/contracts/shared/period";
import { levelColumns, platformColumns } from "./adsColumns";
import type {
  AdPerformanceRow,
  MarketingCampaigns as MarketingCampaignsData,
} from "@ecommerce/contracts/marketing";
import {
  adLevelLabel,
  adMetricLabel,
  roasBands,
  adLevels,
  adMetrics,
  adPlatformFilters,
  type MarketingSearch,
} from "@ecommerce/contracts/marketing";

const platformOptions = adPlatformFilters.map((key) => ({
  key,
  label:
    key === "todas" ? "Todas" : key === "META" ? "Meta" : key === "GOOGLE" ? "Google" : "TikTok",
}));

function CampaignList({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: AdPerformanceRow[];
  empty: string;
}) {
  return (
    <div className="min-w-0">
      <p className={cn(textClass.label, "text-muted-foreground")}>{title}</p>
      {rows.length === 0 ? (
        <p className={cn(textClass.body, "mt-2 text-muted-foreground")}>{empty}</p>
      ) : (
        <ul className="mt-2 divide-y divide-border">
          {rows.map((r) => (
            <li key={r.id} className="flex items-baseline justify-between gap-4 py-2">
              <span className={cn(textClass.body, "min-w-0 truncate")}>{r.name}</span>
              <span
                className={cn(textClass.body, textClass.numeric, "shrink-0 text-muted-foreground")}
              >
                {r.roas == null ? "—" : formatMultiplier(r.roas)} · {formatCurrency(r.spend)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function MarketingCampanhas({
  data,
  search,
  period,
  onPatch,
}: {
  data: MarketingCampaignsData;
  search: MarketingSearch;
  period: PeriodSearch;
  onPatch: (next: Partial<MarketingSearch>) => void;
}) {
  const metric = adMetricLabel[search.metricaAds];
  const suffix = `${period.inicio}-${period.fim}`;

  return (
    <>
      <SectionBlock
        title="Por plataforma"
        description="Investimento, receita atribuída e os indicadores de mídia de cada plataforma."
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
          columns={platformColumns}
          rows={data.platforms}
          totalRow={data.total}
          rowKey={(r) => r.id}
          csvFileName={`marketing-plataformas-${suffix}`}
        />
      </SectionBlock>

      <SectionBlock
        title="Plataformas no tempo"
        description="A métrica escolhida por período, uma linha por plataforma."
        meta={
          <SegmentedControl
            label="Métrica de mídia"
            options={adMetrics.map((key) => ({ key, label: adMetricLabel[key].label }))}
            value={search.metricaAds}
            onChange={(metricaAds) => onPatch({ metricaAds })}
          />
        }
        bodyClassName={layout.cardPadding}
      >
        <MultiSeriesChart
          series={data.platformSeries}
          unit={metric.unit}
          granularity={period.por}
        />
      </SectionBlock>

      <SectionBlock
        title="Melhores e piores campanhas"
        description={`Por ROAS, entre as campanhas com investimento no período. Alto acima de ${roasBands.high}x, baixo abaixo de ${roasBands.low}x.`}
        bodyClassName={layout.cardPadding}
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <CampaignList title="Melhores" rows={data.best} empty="Sem campanhas no período." />
          <CampaignList title="Piores" rows={data.worst} empty="Sem campanhas para comparar." />
        </div>
      </SectionBlock>

      <SectionBlock
        title={adLevelLabel[search.nivel]}
        description="Cada linha da hierarquia com os indicadores de mídia; exporte a lista completa em CSV."
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl
              label="Plataforma"
              options={platformOptions}
              value={search.plataforma}
              onChange={(plataforma) => onPatch({ plataforma })}
            />
            <SegmentedControl
              label="Nível"
              options={adLevels.map((key) => ({ key, label: adLevelLabel[key] }))}
              value={search.nivel}
              onChange={(nivel) => onPatch({ nivel })}
            />
          </div>
        }
      >
        <DataTable
          columns={levelColumns(search.nivel)}
          rows={data.rows}
          rowKey={(r) => r.id}
          initialSort={{ key: "spend", direction: "desc" }}
          initialPageSize={10}
          csvFileName={`marketing-${search.nivel}-${suffix}`}
          emptyMessage="Sem mídia paga no período."
        />
      </SectionBlock>
    </>
  );
}
