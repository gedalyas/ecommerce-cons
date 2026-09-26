import { formatMetric } from "../shared/metricFormat";
import type { MetricUnit } from "../shared/metric.types";
import type { ReportCell } from "./reports.types";

export function formatReportCell(cell: ReportCell, unit: MetricUnit | "text"): string {
  if (cell === null || cell === "") return "—";
  if (unit === "text" || typeof cell === "string") return String(cell);
  return formatMetric(cell, unit);
}
