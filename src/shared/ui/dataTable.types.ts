import type { ReactNode } from "react";
import type { CsvCell } from "@/shared/utils/csv";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  align?: "left" | "right";
  render: (row: T) => ReactNode;
  /** Value written to the CSV; defaults to the rendered text when omitted. */
  csv?: (row: T) => CsvCell;
  /** Enables sorting on the column. */
  sortValue?: (row: T) => number | string | null;
  /** Rendered on the TOTAL row; defaults to `render`. */
  renderTotal?: (row: T) => ReactNode;
  className?: string;
};

export type DataTableSort = { key: string; direction: "asc" | "desc" };

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Aggregated row pinned under the page, rendered in bold. */
  totalRow?: T;
  initialSort?: DataTableSort;
  pageSizeOptions?: number[];
  initialPageSize?: number;
  /** When set, shows the "Exportar CSV" action (exports every row, not just the page). */
  csvFileName?: string;
  emptyMessage?: string;
  className?: string;
};
