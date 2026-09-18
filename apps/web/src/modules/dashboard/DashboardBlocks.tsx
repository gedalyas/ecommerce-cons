import { Link } from "@tanstack/react-router";
import { DataTable, type DataTableColumn } from "@/shared/ui/DataTable";
import { metricToTile } from "@/shared/ui/metricToTile";
import { MetricTileGroup } from "@/shared/ui/MetricTileGroup";
import { RecommendationList } from "@/shared/ui/RecommendationList";
import { SectionBlock } from "@/shared/ui/SectionBlock";
import { MilestoneEditor, recommendationOf } from "@/modules/consulting/contract";
import { layout } from "@/shared/styles/spacing";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { formatMetric } from "@ecommerce/contracts/shared/metricFormat";
import type { PeriodSearch } from "@ecommerce/contracts/shared/period";
import {
  dashboardWidgetCatalog,
  type DashboardMatrixRow,
  type DashboardMetricKey,
  type DashboardOverview,
} from "@ecommerce/contracts/dashboard";
import { bucketHeader } from "./bucketHeader";

type BlockProps = { data: DashboardOverview; period: PeriodSearch; comparisonLabel: string };

const catalog = dashboardWidgetCatalog;

const headlineKeys: DashboardMetricKey[] = [
  "totalSold",
  "contributionMargin",
  "cac",
  "repurchaseRate",
];
const headlineLabel: Partial<Record<DashboardMetricKey, string>> = { totalSold: "Faturamento" };

export function HeadlineWidget({ data, comparisonLabel }: BlockProps) {
  const byKey = new Map(data.metrics.map((m) => [m.key, m]));
  const tiles = headlineKeys.flatMap((key) => {
    const m = byKey.get(key);
    return m
      ? [
          metricToTile({
            label: headlineLabel[key] ?? m.label,
            metric: m.metric,
            comparisonLabel,
            goodWhen: m.goodWhen,
          }),
        ]
      : [];
  });
  return <MetricTileGroup metrics={tiles} />;
}

export function MatrixWidget({ data, period }: BlockProps) {
  const columns: DataTableColumn<DashboardMatrixRow>[] = [
    {
      key: "metric",
      header: "Métrica",
      render: (r) => r.label,
      csv: (r) => r.label,
      className: "whitespace-nowrap font-semibold",
    },
    ...data.matrix.buckets.map((bucket, i) => ({
      key: bucket,
      header: bucketHeader(bucket, period.por),
      align: "right" as const,
      render: (r: DashboardMatrixRow) => formatMetric(r.values[i] ?? null, r.unit),
      csv: (r: DashboardMatrixRow) => {
        const v = r.values[i];
        return v == null ? null : Math.round(v * 100) / 100;
      },
      className: "whitespace-nowrap",
    })),
  ];
  return (
    <SectionBlock title={catalog.matrix.label} description={catalog.matrix.description}>
      <DataTable
        columns={columns}
        rows={data.matrix.rows}
        rowKey={(r) => r.key}
        initialPageSize={20}
        pageSizeOptions={[20]}
        csvFileName={`resumo-financeiro-${period.inicio}-${period.fim}`}
      />
    </SectionBlock>
  );
}

export function AlertsWidget({ data }: BlockProps) {
  return (
    <SectionBlock
      title={catalog.alerts.label}
      tone="warning"
      description="Alertas derivados dos dados: últimos 7 dias contra os 7 anteriores, e o estoque no ritmo dos últimos 30."
      bodyClassName={layout.cardPaddingX}
    >
      {data.alerts.length === 0 ? (
        <p className={cn(textClass.body, "py-4 text-muted-foreground")}>
          Nenhum alerta no momento.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {data.alerts.map((alert) => (
            <li key={alert.title} className="group">
              <Link
                to={alert.to}
                search={(prev: Record<string, unknown>) => ({ ...prev, ...alert.search })}
                className="flex flex-wrap items-start gap-3 py-4 no-underline"
              >
                <div className="min-w-0 flex-1">
                  <div className={cn(textClass.body, "font-semibold text-foreground")}>
                    {alert.title}
                  </div>
                  <p className={cn(textClass.meta, "mt-1 text-muted-foreground")}>{alert.detail}</p>
                </div>
                <span
                  className={cn(
                    textClass.meta,
                    "shrink-0 text-right text-muted-foreground transition-colors duration-150 group-hover:text-primary",
                  )}
                >
                  {alert.origin}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionBlock>
  );
}

export function MilestoneWidget({ data, canEdit }: BlockProps & { canEdit: boolean }) {
  return (
    <SectionBlock
      title={catalog.milestone.label}
      tone="highlight"
      meta={
        <span className="flex items-center gap-2">
          <span className={cn(textClass.numeric, textClass.meta, "text-muted-foreground")}>
            {data.milestone.achieved} de {data.milestone.total} critérios
          </span>
          {canEdit && <MilestoneEditor criteria={data.milestone.criteria} />}
        </span>
      }
      description="Atingir os 4 critérios libera as áreas bloqueadas: Canais paralelos e Tecnologia."
      bodyClassName="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4"
    >
      {data.milestone.criteria.map((c) => (
        <div key={c.name} className="min-w-0 rounded-lg border border-border bg-card p-5">
          <div className={cn(textClass.body, "font-semibold text-foreground")}>{c.name}</div>
          <div className="mt-3 h-1 w-full overflow-hidden rounded-sm bg-muted">
            <div
              className={cn("h-full rounded-sm", c.achieved ? "bg-primary" : "bg-warning")}
              style={{ width: `${c.progress}%` }}
            />
          </div>
          <div className={cn(textClass.meta, "mt-2 text-muted-foreground")}>
            <span className={cn("font-semibold", c.achieved ? "text-primary" : "text-warning")}>
              {c.achieved ? "Atingido" : "Não atingido"}
            </span>
            {" · "}
            {c.note || c.hint}
          </div>
        </div>
      ))}
    </SectionBlock>
  );
}

export function RecommendationsWidget({ data }: BlockProps) {
  return (
    <SectionBlock title={catalog.recommendations.label} bodyClassName={layout.cardPaddingX}>
      <RecommendationList items={data.recommendations.map(recommendationOf)} />
    </SectionBlock>
  );
}
