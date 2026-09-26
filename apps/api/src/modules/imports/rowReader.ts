import {
  importTemplates,
  normalizeHeader,
  parseImportDate,
  parseImportInteger,
  parseImportNumber,
  parseImportOption,
  type ImportColumn,
  type ImportKind,
  type ImportRowError,
} from "@ecommerce/contracts/imports";

export type ColumnIndex = Map<string, number>;

export function columnIndexOf(kind: ImportKind, header: string[]): ColumnIndex {
  const normalized = header.map(normalizeHeader);
  const index: ColumnIndex = new Map();
  for (const column of importTemplates[kind].columns) {
    const position = normalized.indexOf(column.header);
    if (position >= 0) index.set(column.key, position);
  }
  return index;
}

export class RowError extends Error {}

export class RowReader {
  private readonly columns: Map<string, ImportColumn>;

  constructor(
    kind: ImportKind,
    private readonly index: ColumnIndex,
    private readonly cells: string[],
    readonly row: number,
  ) {
    this.columns = new Map(importTemplates[kind].columns.map((c) => [c.key, c]));
  }

  private raw(key: string): string {
    const position = this.index.get(key);
    return position === undefined ? "" : (this.cells[position] ?? "").trim();
  }

  private header(key: string): string {
    return this.columns.get(key)?.header ?? key;
  }

  private fail(key: string, why: string): never {
    throw new RowError(`Linha ${this.row}: coluna "${this.header(key)}" ${why}.`);
  }

  text(key: string): string {
    const value = this.raw(key);
    if (value === "" && this.columns.get(key)?.required) this.fail(key, "é obrigatória");
    return value;
  }

  optionalText(key: string): string | null {
    const value = this.raw(key);
    return value === "" ? null : value;
  }

  number(key: string, fallback: number | null = null): number {
    const value = this.raw(key);
    if (value === "") {
      if (fallback !== null) return fallback;
      this.fail(key, "é obrigatória");
    }
    const parsed = parseImportNumber(value);
    if (parsed === null) this.fail(key, `tem um número inválido ("${value}")`);
    return parsed;
  }

  optionalNumber(key: string): number | null {
    const value = this.raw(key);
    if (value === "") return null;
    const parsed = parseImportNumber(value);
    if (parsed === null) this.fail(key, `tem um número inválido ("${value}")`);
    return parsed;
  }

  integer(key: string, fallback: number | null = null): number {
    const value = this.raw(key);
    if (value === "") {
      if (fallback !== null) return fallback;
      this.fail(key, "é obrigatória");
    }
    const parsed = parseImportInteger(value);
    if (parsed === null) this.fail(key, `tem um inteiro inválido ("${value}")`);
    return parsed;
  }

  date(key: string): string {
    const value = this.text(key);
    const parsed = parseImportDate(value);
    if (parsed === null) this.fail(key, `tem uma data inválida ("${value}")`);
    return parsed;
  }

  option<T extends string>(key: string, options: readonly T[], fallback: T | null = null): T {
    const value = this.raw(key);
    if (value === "") {
      if (fallback !== null) return fallback;
      this.fail(key, "é obrigatória");
    }
    const parsed = parseImportOption(value, options);
    if (parsed === null) this.fail(key, `aceita ${options.join(", ")} (veio "${value}")`);
    return parsed;
  }
}

export function collectRows<T>(
  kind: ImportKind,
  header: string[],
  rows: string[][],
  map: (reader: RowReader) => T,
): { parsed: T[]; errors: ImportRowError[] } {
  const index = columnIndexOf(kind, header);
  const parsed: T[] = [];
  const errors: ImportRowError[] = [];
  rows.forEach((cells, i) => {
    const row = i + 2;
    try {
      parsed.push(map(new RowReader(kind, index, cells, row)));
    } catch (error) {
      if (error instanceof RowError) errors.push({ row, message: error.message });
      else throw error;
    }
  });
  return { parsed, errors };
}
