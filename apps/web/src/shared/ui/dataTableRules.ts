import type { DataTableColumn, DataTableSort } from "./dataTable.types";

export type MobileColumns<T> = {
  title: DataTableColumn<T> | null;
  lead: DataTableColumn<T> | null;
  details: DataTableColumn<T>[];
  actions: DataTableColumn<T>[];
};

export function mobileColumnsOf<T>(columns: DataTableColumn<T>[]): MobileColumns<T> {
  const visible = columns.filter((column) => column.mobile !== "hidden");
  const actions = visible.filter((column) => column.header === "");
  const labelled = visible.filter((column) => column.header !== "");
  const title = labelled.find((column) => column.mobile === "title") ?? labelled[0] ?? null;
  const lead =
    labelled.find((column) => column.mobile === "lead") ??
    labelled.find((column) => column !== title && column.align === "right") ??
    null;
  const details = labelled.filter((column) => column !== title && column !== lead);
  return { title, lead, details, actions };
}

export function nextSortOf(key: string, previous: DataTableSort | null): DataTableSort {
  if (previous?.key === key) {
    return { key, direction: previous.direction === "asc" ? "desc" : "asc" };
  }
  return { key, direction: "desc" };
}

function compare(a: number | string | null, b: number | string | null) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "pt-BR");
}

export function sortRows<T>(
  rows: T[],
  columns: DataTableColumn<T>[],
  sort: DataTableSort | null,
): T[] {
  if (!sort) return rows;
  const column = columns.find((c) => c.key === sort.key);
  if (!column?.sortValue) return rows;
  const getter = column.sortValue;
  const factor = sort.direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => compare(getter(a), getter(b)) * factor);
}
