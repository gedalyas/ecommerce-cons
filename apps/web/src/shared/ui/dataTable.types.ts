import type { ReactNode } from "react";
import type { CsvCell } from "@/shared/utils/csv";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  align?: "left" | "right";
  render: (row: T) => ReactNode;
  csv?: (row: T) => CsvCell;
  sortValue?: (row: T) => number | string | null;
  renderTotal?: (row: T) => ReactNode;
  mobile?: DataTableMobileRole;
  className?: string;
};

export type DataTableMobileRole = "title" | "lead" | "hidden";

export type DataTableMobileLayout = "cards" | "scroll";

export type DataTableSort = { key: string; direction: "asc" | "desc" };

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
  totalRow?: T;
  initialSort?: DataTableSort;
  pageSizeOptions?: number[];
  initialPageSize?: number;
  csvFileName?: string;
  remote?: DataTableRemote<T>;
  emptyMessage?: string;
  mobileLayout?: DataTableMobileLayout;
  className?: string;
};
