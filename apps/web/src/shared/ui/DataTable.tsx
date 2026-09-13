import { ArrowDown, ArrowUp, ArrowUpDown, Download } from "lucide-react";
import { isValidElement, useMemo, useState, type ReactNode } from "react";
import { Button } from "./Button";
import { cn } from "@/shared/utils/cn";
import { downloadCsv, type CsvCell } from "@/shared/utils/csv";
import { formatNumber } from "@ecommerce/contracts/shared/format";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/Select";
import { textClass } from "@/shared/styles/typography";
import type { DataTableColumn, DataTableProps, DataTableSort } from "./dataTable.types";

export type { DataTableColumn, DataTableProps, DataTableSort } from "./dataTable.types";

const DEFAULT_PAGE_SIZES = [10, 20, 50, 100];

function textOf(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

function compare(a: number | string | null, b: number | string | null) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "pt-BR");
}

/**
 * Analytics table: sortable columns, client-side pagination, a pinned TOTAL
 * row and CSV export. Rows are plain objects; columns decide how to show them.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  totalRow,
  initialSort,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  initialPageSize = pageSizeOptions[0] ?? 10,
  csvFileName,
  remote,
  emptyMessage = "Não há dados disponíveis para os filtros selecionados.",
  className,
}: DataTableProps<T>) {
  const [localSort, setLocalSort] = useState<DataTableSort | null>(initialSort ?? null);
  const [localPageSize, setLocalPageSize] = useState(initialPageSize);
  const [localPage, setLocalPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const sort = remote ? remote.sort : localSort;
  const pageSize = remote ? remote.pageSize : localPageSize;
  const page = remote ? remote.page : localPage;

  const sorted = useMemo(() => {
    if (remote || !sort) return rows;
    const column = columns.find((c) => c.key === sort.key);
    if (!column?.sortValue) return rows;
    const getter = column.sortValue;
    const factor = sort.direction === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => compare(getter(a), getter(b)) * factor);
  }, [rows, columns, sort, remote]);

  const total = remote ? remote.total : sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = remote ? rows : sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const nextSort = (column: DataTableColumn<T>, prev: DataTableSort | null): DataTableSort =>
    prev?.key === column.key
      ? { key: column.key, direction: prev.direction === "asc" ? "desc" : "asc" }
      : { key: column.key, direction: "desc" };

  const toggleSort = (column: DataTableColumn<T>) => {
    if (!column.sortValue) return;
    if (remote) {
      remote.onChange({ page: 1, pageSize, sort: nextSort(column, remote.sort) });
      return;
    }
    setLocalPage(1);
    setLocalSort((prev) => nextSort(column, prev));
  };

  const goToPage = (next: number) => {
    if (remote) remote.onChange({ page: next, pageSize, sort: remote.sort });
    else setLocalPage(next);
  };

  const changePageSize = (next: number) => {
    if (remote) remote.onChange({ page: 1, pageSize: next, sort: remote.sort });
    else {
      setLocalPageSize(next);
      setLocalPage(1);
    }
  };

  const exportCsv = async () => {
    if (!csvFileName) return;
    const cell = (column: DataTableColumn<T>, row: T): CsvCell =>
      column.csv ? column.csv(row) : textOf(column.render(row));
    setExporting(true);
    try {
      const source = remote?.exportRows ? await remote.exportRows() : sorted;
      const body = source.map((row) => columns.map((c) => cell(c, row)));
      if (totalRow) body.push(columns.map((c) => cell(c, totalRow)));
      downloadCsv(csvFileName, [columns.map((c) => c.header), ...body]);
    } finally {
      setExporting(false);
    }
  };

  const cellClass = (column: DataTableColumn<T>) =>
    cn(
      "px-4 py-3 align-middle",
      column.align === "right" && cn(textClass.numeric, "text-right"),
      column.className,
    );

  return (
    <div className={cn("min-w-0", className)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[15px] leading-6">
          <thead>
            <tr className="border-b border-border">
              {columns.map((column) => {
                const active = sort?.key === column.key;
                const Icon = !active ? ArrowUpDown : sort.direction === "asc" ? ArrowUp : ArrowDown;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={
                      active ? (sort.direction === "asc" ? "ascending" : "descending") : undefined
                    }
                    className={cn(
                      cellClass(column),
                      textClass.label,
                      "py-2 whitespace-nowrap text-muted-foreground",
                    )}
                  >
                    {column.sortValue ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column)}
                        className={cn(
                          "inline-flex items-center gap-1 hover:text-foreground",
                          column.align === "right" && "flex-row-reverse",
                          active && "text-foreground",
                        )}
                      >
                        {column.header}
                        <Icon className="h-3 w-3" aria-hidden />
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pageRows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className={cn(textClass.meta, "px-4 py-10 text-center text-muted-foreground")}
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
            {pageRows.map((row) => (
              <tr key={rowKey(row)} className="transition-colors duration-150 hover:bg-muted/40">
                {columns.map((column) => (
                  <td key={column.key} className={cellClass(column)}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {totalRow && pageRows.length > 0 && (
            <tfoot>
              <tr className="border-t border-border bg-muted/40 font-semibold">
                {columns.map((column) => (
                  <td key={column.key} className={cellClass(column)}>
                    {(column.renderTotal ?? column.render)(totalRow)}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div
        className={cn(
          textClass.meta,
          "flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-muted-foreground",
        )}
      >
        <div className="flex items-center gap-2">
          <span>Por página</span>
          <Select value={String(pageSize)} onValueChange={(v) => changePageSize(Number(v))}>
            <SelectTrigger className="h-8 w-[72px] shadow-none" aria-label="Linhas por página">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className={textClass.numeric}>
            {formatNumber(total)} {total === 1 ? "linha" : "linhas"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {csvFileName && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void exportCsv()}
              disabled={total === 0 || exporting}
            >
              <Download className="h-4 w-4" aria-hidden />
              {exporting ? "Exportando…" : "Exportar CSV"}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(safePage - 1)}
            disabled={safePage <= 1}
          >
            Anterior
          </Button>
          <span className={cn(textClass.numeric, "whitespace-nowrap")}>
            Página {safePage} de {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(safePage + 1)}
            disabled={safePage >= pageCount}
          >
            Próximo
          </Button>
        </div>
      </div>
    </div>
  );
}
