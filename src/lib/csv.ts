/**
 * CSV export in the pt-BR convention Excel expects: semicolon separator,
 * decimal comma, UTF-8 with BOM. Browser-only (creates a download link).
 */
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
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName.endsWith(".csv") ? fileName : `${fileName}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
