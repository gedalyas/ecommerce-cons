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

/**
 * Server-driven paging and sorting: `rows` is the current page, the table
 * reports every change and lets the caller fetch the full set for the CSV.
 */
export type DataTableRemote<T> = {
  page: number;
  pageSize: number;
  total: number;
  sort: DataTableSort | null;
  onChange: (next: { page: number; pageSize: number; sort: DataTableSort | null }) => void;
  exportRows?: () => Promise<T[]>;
};

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
  /** Hands paging and sorting to the server; without it the table pages `rows` itself. */
  remote?: DataTableRemote<T>;
  emptyMessage?: string;
  className?: string;
};
