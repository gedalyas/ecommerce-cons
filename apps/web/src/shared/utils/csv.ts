import { downloadBlob } from "./download";

export type CsvCell = string | number | null | undefined;

const BOM = "\u{FEFF}";

function escapeCell(cell: CsvCell) {
  if (cell == null) return "";
  const text = typeof cell === "number" ? String(cell).replace(".", ",") : cell;
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: CsvCell[][]) {
  return BOM + rows.map((row) => row.map(escapeCell).join(";")).join("\r\n");
}

export function downloadCsv(fileName: string, rows: CsvCell[][]) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
  downloadBlob(fileName.endsWith(".csv") ? fileName : `${fileName}.csv`, blob);
}
