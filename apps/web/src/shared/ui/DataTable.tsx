import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { isValidElement, useMemo, useState, type ReactNode } from "react";
import { DataTableCards } from "./DataTableCards";
import { DataTablePagination } from "./DataTablePagination";
import { nextSortOf, sortRows } from "./dataTableRules";
import { cn } from "@/shared/utils/cn";
import { downloadCsv, type CsvCell } from "@/shared/utils/csv";
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

function cellClass<T>(column: DataTableColumn<T>, nowrap: boolean, pinned = false) {
  return cn(
    "px-4 py-3 align-middle",
    nowrap && "whitespace-nowrap",
    pinned && "sticky left-0 z-10 bg-inherit max-md:max-w-52 max-md:truncate",
    column.align === "right" && cn(textClass.numeric, "text-right"),
    column.className,
  );
}

function HeaderCell<T>({
  column,
  sort,
  nowrap,
  pinned,
  onSort,
}: {
  column: DataTableColumn<T>;
  sort: DataTableSort | null;
  nowrap: boolean;
  pinned: boolean;
  onSort: (column: DataTableColumn<T>) => void;
}) {
  const active = sort?.key === column.key;
  const Icon = !active ? ArrowUpDown : sort.direction === "asc" ? ArrowUp : ArrowDown;
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : undefined}
      className={cn(
        cellClass(column, nowrap, pinned),
        textClass.label,
        "py-2 whitespace-nowrap text-muted-foreground",
      )}
    >
      {column.sortValue ? (
        <button
          type="button"
          onClick={() => onSort(column)}
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
}

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
  mobileLayout = "cards",
  className,
}: DataTableProps<T>) {
  const [localSort, setLocalSort] = useState<DataTableSort | null>(initialSort ?? null);
  const [localPageSize, setLocalPageSize] = useState(initialPageSize);
  const [localPage, setLocalPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const sort = remote ? remote.sort : localSort;
  const pageSize = remote ? remote.pageSize : localPageSize;
  const page = remote ? remote.page : localPage;

  const sorted = useMemo(
    () => (remote ? rows : sortRows(rows, columns, sort)),
    [rows, columns, sort, remote],
  );

  const total = remote ? remote.total : sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = remote ? rows : sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (column: DataTableColumn<T>) => {
    if (!column.sortValue) return;
    if (remote) {
      remote.onChange({ page: 1, pageSize, sort: nextSortOf(column.key, remote.sort) });
      return;
    }
    setLocalPage(1);
    setLocalSort((prev) => nextSortOf(column.key, prev));
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

  const cards = mobileLayout === "cards";
  const nowrap = !cards;
  const pinnedAt = (index: number) => nowrap && index === 0;

  return (
    <div className={cn("min-w-0", className)}>
      {cards && (
        <DataTableCards
          className="md:hidden"
          columns={columns}
          rows={pageRows}
          rowKey={rowKey}
          totalRow={totalRow}
          sort={sort}
          onSort={toggleSort}
          emptyMessage={emptyMessage}
        />
      )}
      <div className={cn("overflow-x-auto", cards && "max-md:hidden")}>
        <table className="w-full border-collapse text-[15px] leading-6">
          <thead>
            <tr className="border-b border-border bg-card">
              {columns.map((column, index) => (
                <HeaderCell
                  key={column.key}
                  column={column}
                  sort={sort}
                  nowrap={nowrap}
                  pinned={pinnedAt(index)}
                  onSort={toggleSort}
                />
              ))}
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
              <tr
                key={rowKey(row)}
                className="bg-card transition-colors duration-150 hover:bg-muted"
              >
                {columns.map((column, index) => (
                  <td key={column.key} className={cellClass(column, nowrap, pinnedAt(index))}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {totalRow && pageRows.length > 0 && (
            <tfoot>
              <tr className="border-t border-border bg-muted font-semibold">
                {columns.map((column, index) => (
                  <td key={column.key} className={cellClass(column, nowrap, pinnedAt(index))}>
                    {(column.renderTotal ?? column.render)(totalRow)}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <DataTablePagination
        total={total}
        page={safePage}
        pageCount={pageCount}
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        onPage={goToPage}
        onPageSize={changePageSize}
        onExport={csvFileName ? () => void exportCsv() : undefined}
        exporting={exporting}
      />
    </div>
  );
}
