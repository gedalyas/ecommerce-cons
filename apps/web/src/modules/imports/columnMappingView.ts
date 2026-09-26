import { normalizeHeader, type ColumnMapping } from "@ecommerce/contracts/imports";

export const SKIP_COLUMN = "__skip__";

export function sourceOptionsOf(header: string[]): string[] {
  const seen = new Set<string>();
  return header.filter((name) => {
    const normalized = normalizeHeader(name);
    if (normalized === "" || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

export function sampleValueOf(header: string[], sample: string[][], source: string | null): string {
  const wanted = source ? normalizeHeader(source) : "";
  const position = wanted ? header.findIndex((name) => normalizeHeader(name) === wanted) : -1;
  if (position < 0) return "";
  return sample.map((cells) => (cells[position] ?? "").trim()).find((value) => value !== "") ?? "";
}

export function withColumn(mapping: ColumnMapping, key: string, source: string): ColumnMapping {
  const { [key]: _previous, ...rest } = mapping;
  return source === SKIP_COLUMN ? rest : { ...rest, [key]: source };
}
