import type { ReportBlock, ReportCell, ReportDocument } from "@ecommerce/contracts/reports";
import { formatPeriodLabel } from "@ecommerce/contracts/shared/format";
import type { Granularity } from "@ecommerce/contracts/shared/period";
import { DataTable } from "@/shared/ui/DataTable";
import { MetricTileGroup } from "@/shared/ui/MetricTileGroup";
import { MultiSeriesChart } from "@/shared/ui/MultiSeriesChart";
import { metricToTile } from "@/shared/ui/metricToTile";
import { layout } from "@/shared/styles/spacing";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { chartSeriesOf, formatReportCell } from "./reportBuilderRules";

type Row = { index: number; cells: Record<string, ReportCell> };

function ReportBlockView({ block, granularity }: { block: ReportBlock; granularity: Granularity }) {
  switch (block.kind) {
    case "kpis":
      return (
        <MetricTileGroup
          metrics={block.items.map((item) =>
            metricToTile({ label: item.label, metric: item.metric }),
          )}
        />
      );
    case "chart":
      return (
        <MultiSeriesChart
          series={chartSeriesOf(block)}
          unit={block.unit}
          granularity={granularity}
        />
      );
    case "table":
      return (
        <DataTable<Row>
          columns={block.columns.map((column) => ({
            key: column.key,
            header: column.label,
            align: column.unit === "text" ? "left" : "right",
            render: (row) => formatReportCell(row.cells[column.key] ?? null, column.unit),
          }))}
          rows={block.rows.map((cells, index) => ({ index, cells }))}
          rowKey={(row) => String(row.index)}
          emptyMessage="Sem dados no período."
        />
      );
    case "note":
      return <p className={cn(textClass.body, "text-muted-foreground")}>{block.text}</p>;
  }
}

export function ReportPreview({
  document,
  granularity,
}: {
  document: ReportDocument;
  granularity: Granularity;
}) {
  return (
    <article className={layout.blockStack} aria-label="Prévia do relatório">
      <header>
        <h3 className={cn(textClass.sectionTitle, "text-foreground")}>{document.title}</h3>
        <p className={cn(textClass.meta, "mt-1 text-muted-foreground")}>
          {formatPeriodLabel(document.range.inicio, document.range.fim, true)}
        </p>
      </header>
      {document.sections.map((section) => (
        <section key={section.key} className={layout.groupStack}>
          <h4 className={cn(textClass.cardTitle, "text-foreground")}>{section.title}</h4>
          {section.blocks.map((block, i) => (
            <ReportBlockView key={i} block={block} granularity={granularity} />
          ))}
        </section>
      ))}
    </article>
  );
}
