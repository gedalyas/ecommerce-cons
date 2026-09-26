import {
  reportSectionKeys,
  reportTemplateSections,
  type ReportBlock,
  type ReportCell,
  type ReportSectionKey,
  type ReportTemplate,
} from "@ecommerce/contracts/reports";
import { formatMetric } from "@ecommerce/contracts/shared/metricFormat";
import type { MetricUnit, SeriesPoint } from "@ecommerce/contracts/shared/metric.types";

type ChartBlock = Extract<ReportBlock, { kind: "chart" }>;

export function formatReportCell(cell: ReportCell, unit: MetricUnit | "text"): string {
  if (cell === null || cell === "") return "—";
  if (unit === "text" || typeof cell === "string") return String(cell);
  return formatMetric(cell, unit);
}

export function chartSeriesOf(
  block: ChartBlock,
): { key: string; label: string; points: SeriesPoint[] }[] {
  return block.series.map((series) => ({
    key: series.key,
    label: series.label,
    points: block.buckets.map((bucket, i) => ({ bucket, value: series.values[i] ?? 0 })),
  }));
}

export function toggledSections(
  sections: readonly ReportSectionKey[],
  key: ReportSectionKey,
): ReportSectionKey[] {
  return reportSectionKeys.filter((k) =>
    k === key ? !sections.includes(k) : sections.includes(k),
  );
}

export function templateSectionsFor(
  template: ReportTemplate,
  available: readonly ReportSectionKey[],
): ReportSectionKey[] {
  return reportTemplateSections[template].filter((key) => available.includes(key));
}
