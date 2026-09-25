import type { DataTableColumn } from "@/shared/ui/DataTable";
import { explanationOf } from "@ecommerce/contracts/glossary";

export function withHints<T>(
  columns: readonly DataTableColumn<T>[],
  terms: Readonly<Record<string, string>>,
): DataTableColumn<T>[] {
  return columns.map((column) => {
    const term = terms[column.key];
    return term ? { ...column, hint: explanationOf(term) } : column;
  });
}
