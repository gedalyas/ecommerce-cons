import { z } from "zod";
import {
  importTemplates,
  normalizeHeader,
  type ColumnMapping,
  type ImportKind,
} from "@ecommerce/contracts/imports";
import { columnLabelOf } from "./sampleMask";

export type SuggestionColumn = { id: string; name: string };

const suggestionSchema = z.object({
  columns: z.array(z.object({ field: z.string(), column: z.string() })),
});

const idOf = (position: number) => `c${position}`;

export function suggestionColumns(header: string[]): SuggestionColumn[] {
  const seen = new Set<string>();
  return header.flatMap((name, position) => {
    const normalized = normalizeHeader(name);
    if (normalized === "" || seen.has(normalized)) return [];
    seen.add(normalized);
    return [{ id: idOf(position), name: columnLabelOf(name) }];
  });
}

export function suggestionFormat(kind: ImportKind, columns: SuggestionColumn[]) {
  return {
    type: "json_schema" as const,
    schema: {
      type: "object",
      properties: {
        columns: {
          type: "array",
          items: {
            type: "object",
            properties: {
              field: { type: "string", enum: importTemplates[kind].columns.map((c) => c.key) },
              column: { type: "string", enum: columns.map((c) => c.id) },
            },
            required: ["field", "column"],
            additionalProperties: false,
          },
        },
      },
      required: ["columns"],
      additionalProperties: false,
    },
  };
}

export const SUGGESTION_SYSTEM =
  "You map the columns of a Brazilian e-commerce spreadsheet to the fields of an import template. " +
  "Answer only with the JSON asked for, naming each column by its id. Pair a field with a column " +
  "only when the column's name or its sample values clearly hold that field; leave a field out " +
  "when no column fits. Never use a column for two fields. Sample values are anonymized: letters " +
  "became 'a' / 'A' and digits became '0' wherever they could identify a person; dates, amounts, " +
  "product codes and option words are real.";

export function suggestionPrompt(
  kind: ImportKind,
  columns: SuggestionColumn[],
  sample: string[][],
): string {
  const fields = importTemplates[kind].columns.map(
    (c) =>
      `- ${c.key} ("${c.header}", ${c.type}${c.required ? ", required" : ""}, e.g. ${c.example})`,
  );
  return [
    `Template: ${importTemplates[kind].description}`,
    "Fields:",
    ...fields,
    "",
    "Spreadsheet columns (id c<N> is the N-th cell of each row) and sample rows (JSON):",
    JSON.stringify({ columns, rows: sample }),
  ].join("\n");
}

export function mappingOfSuggestion(
  kind: ImportKind,
  header: string[],
  raw: unknown,
): ColumnMapping {
  const parsed = suggestionSchema.safeParse(raw);
  if (!parsed.success) return {};
  const fields = new Set(importTemplates[kind].columns.map((c) => c.key));
  const named = new Map(suggestionColumns(header).map((c) => [c.id, c]));
  const used = new Set<string>();
  const mapping: ColumnMapping = {};
  for (const { field, column } of parsed.data.columns) {
    const position = named.has(column) ? Number(column.slice(1)) : -1;
    const source = header[position]?.trim();
    if (!fields.has(field) || mapping[field] || !source || used.has(source)) continue;
    used.add(source);
    mapping[field] = source;
  }
  return mapping;
}
