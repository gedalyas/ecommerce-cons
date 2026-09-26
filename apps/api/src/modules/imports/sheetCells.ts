export type SheetTable = { header: string[]; rows: string[][] };

export function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "" : value.toISOString().slice(0, 10);
  }
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  if (typeof value === "boolean") return value ? "sim" : "não";
  return String(value).trim();
}

export function sheetTable(data: readonly (readonly unknown[])[]): SheetTable {
  const [first = [], ...rest] = data;
  return {
    header: first.map(cellText),
    rows: rest
      .map((row) => row.slice(0, first.length))
      .map((row) => row.map(cellText))
      .filter((cells) => cells.some((cell) => cell !== "")),
  };
}

export type XlsxRequest = { buffer: Uint8Array; maxRows: number };

export type XlsxReply =
  { ok: true; table: SheetTable } | { ok: false; status: 415 | 422; message: string };
