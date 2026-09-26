import {
  reportSectionKeys,
  reportTemplateSections,
  type ReportBlock,
  type ReportRequest,
  type ReportSectionKey,
  type ReportTemplate,
} from "@ecommerce/contracts/reports";
import type { SeriesPoint } from "@ecommerce/contracts/shared/metric.types";
import type { DateRange, PeriodSearch } from "@ecommerce/contracts/shared/period";

type ChartBlock = Extract<ReportBlock, { kind: "chart" }>;

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

export function reportRequestOf(
  range: DateRange,
  sections: ReportSectionKey[],
  period: PeriodSearch,
): ReportRequest {
  return { ...range, sections, por: period.por, comparar: period.comparar, canal: period.canal };
}
