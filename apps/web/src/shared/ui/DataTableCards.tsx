import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "./Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./Select";
import { mobileColumnsOf, type MobileColumns } from "./dataTableRules";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import type { DataTableColumn, DataTableSort } from "./dataTable.types";

type DataTableCardsProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  totalRow?: T | undefined;
  sort: DataTableSort | null;
  onSort: (column: DataTableColumn<T>) => void;
  emptyMessage: string;
  className?: string | undefined;
};

function CardRow<T>({
  row,
  mobile,
  total = false,
}: {
  row: T;
  mobile: MobileColumns<T>;
  total?: boolean;
}) {
  const cell = (column: DataTableColumn<T>) =>
    total ? (column.renderTotal ?? column.render)(row) : column.render(row);
  return (
    <li className={cn("space-y-2 px-4 py-3", total && "bg-muted/40 font-semibold")}>
      {(mobile.title || mobile.lead) && (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 text-[15px] leading-6 font-semibold text-foreground">
            {mobile.title ? (total ? "Total" : cell(mobile.title)) : null}
          </div>
          {mobile.lead && (
            <div className={cn(textClass.numeric, "shrink-0 text-right text-[15px] leading-6")}>
              {cell(mobile.lead)}
            </div>
          )}
        </div>
      )}
      {mobile.details.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
          {mobile.details.map((column) => (
            <div key={column.key} className="min-w-0">
              <dt className={cn(textClass.label, "text-muted-foreground")}>{column.header}</dt>
              <dd
                className={cn(
                  textClass.meta,
                  "mt-0.5 break-words text-foreground",
                  column.align === "right" && textClass.numeric,
                )}
              >
                {cell(column)}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {mobile.actions.length > 0 && (
        <div className="flex flex-wrap justify-end gap-2">
          {mobile.actions.map((column) => (
            <div key={column.key}>{cell(column)}</div>
          ))}
        </div>
      )}
    </li>
  );
}

function SortControl<T>({
  columns,
  sort,
  onSort,
}: Pick<DataTableCardsProps<T>, "columns" | "sort" | "onSort">) {
  const sortable = columns.filter((column) => column.sortValue);
  if (sortable.length === 0) return null;
  const active = sortable.find((column) => column.key === sort?.key) ?? null;
  const Icon = sort?.direction === "asc" ? ArrowUp : ArrowDown;
  return (
    <div className="flex items-center gap-2 border-b border-border px-4 py-3">
      <span className={cn(textClass.meta, "shrink-0 text-muted-foreground")}>Ordenar por</span>
      <Select
        value={active?.key ?? ""}
        onValueChange={(key) => {
          const column = sortable.find((c) => c.key === key);
          if (column) onSort(column);
        }}
      >
        <SelectTrigger className="h-8 min-w-0 flex-1 shadow-none" aria-label="Ordenar por">
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          {sortable.map((column) => (
            <SelectItem key={column.key} value={column.key}>
              {column.header}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="sm"
        className="w-8 px-0"
        disabled={!active}
        onClick={() => active && onSort(active)}
        aria-label={sort?.direction === "asc" ? "Ordem crescente" : "Ordem decrescente"}
      >
        <Icon aria-hidden />
      </Button>
    </div>
  );
}

export function DataTableCards<T>({
  columns,
  rows,
  rowKey,
  totalRow,
  sort,
  onSort,
  emptyMessage,
  className,
}: DataTableCardsProps<T>) {
  const mobile = mobileColumnsOf(columns);
  return (
    <div className={className}>
      <SortControl columns={columns} sort={sort} onSort={onSort} />
      <ul className="divide-y divide-border">
        {rows.length === 0 && (
          <li className={cn(textClass.meta, "px-4 py-10 text-center text-muted-foreground")}>
            {emptyMessage}
          </li>
        )}
        {rows.map((row) => (
          <CardRow key={rowKey(row)} row={row} mobile={mobile} />
        ))}
        {totalRow !== undefined && rows.length > 0 && (
          <CardRow row={totalRow} mobile={mobile} total />
        )}
      </ul>
    </div>
  );
}
