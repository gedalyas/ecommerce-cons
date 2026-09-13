import type {
  ImportPreviewCell,
  ImportPreviewColumn,
  ImportPreviewSummary,
} from "@ecommerce/contracts/imports";
import { formatCurrency, formatDate, formatNumber } from "@ecommerce/contracts/shared/format";

const day = (iso: string) => formatDate(`${iso}T00:00:00`, { day: "2-digit", month: "2-digit" });

export function previewCell(value: ImportPreviewCell, type: ImportPreviewColumn["type"]): string {
  if (value === null || value === "") return "—";
  if (typeof value === "number") {
    return type === "currency" ? formatCurrency(value, 2) : formatNumber(value);
  }
  return type === "date" ? day(value) : value;
}

export function previewSummaryText(summary: ImportPreviewSummary): string {
  const span = summary.from && summary.to ? ` · ${day(summary.from)} a ${day(summary.to)}` : "";
  return `${formatNumber(summary.count)} ${summary.label}${span}`;
}
