import { Download } from "lucide-react";
import { Button } from "./Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./Select";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { formatNumber } from "@ecommerce/contracts/shared/format";

type DataTablePaginationProps = {
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
  pageSizeOptions: number[];
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
  onExport?: (() => void) | undefined;
  exporting: boolean;
};

export function DataTablePagination({
  total,
  page,
  pageCount,
  pageSize,
  pageSizeOptions,
  onPage,
  onPageSize,
  onExport,
  exporting,
}: DataTablePaginationProps) {
  return (
    <div
      className={cn(
        textClass.meta,
        "flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-muted-foreground",
      )}
    >
      <div className="flex items-center gap-2">
        <span>Por página</span>
        <Select value={String(pageSize)} onValueChange={(v) => onPageSize(Number(v))}>
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
        <span className={cn(textClass.numeric, "whitespace-nowrap")}>
          {formatNumber(total)} {total === 1 ? "linha" : "linhas"}
        </span>
      </div>

      <div className="flex items-center gap-2 max-sm:w-full max-sm:justify-between">
        {onExport && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                disabled={total === 0 || exporting}
                aria-label={exporting ? "Exportando…" : "Exportar CSV"}
                className="max-sm:w-8 max-sm:px-0"
              >
                <Download className="h-4 w-4" aria-hidden />
                <span className="max-sm:sr-only">{exporting ? "Exportando…" : "Exportar CSV"}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="sm:hidden">Exportar CSV</TooltipContent>
          </Tooltip>
        )}
        <Button variant="outline" size="sm" onClick={() => onPage(page - 1)} disabled={page <= 1}>
          Anterior
        </Button>
        <span className={cn(textClass.numeric, "whitespace-nowrap")}>
          Página {page} de {pageCount}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPage(page + 1)}
          disabled={page >= pageCount}
        >
          Próximo
        </Button>
      </div>
    </div>
  );
}
