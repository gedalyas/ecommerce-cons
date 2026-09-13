import { importStatusLabel, type ImportJob } from "@ecommerce/contracts/imports";
import { Badge } from "@/shared/ui/Badge";
import { radiusClass } from "@/shared/styles/radius";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { formatNumber } from "@ecommerce/contracts/shared/format";
import { importStatusTone } from "./importHistoryColumns";

export function ImportResult({ job }: { job: ImportJob }) {
  return (
    <div className={cn("border border-border bg-card p-4", radiusClass.card)} role="status">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={importStatusTone[job.status]}>{importStatusLabel[job.status]}</Badge>
        <span className={cn(textClass.body, "text-foreground")}>
          {formatNumber(job.rowsImported)} de {formatNumber(job.rowsTotal)} linhas importadas
          {job.rowsRejected > 0 ? ` · ${formatNumber(job.rowsRejected)} rejeitadas` : ""}
        </span>
      </div>
      {job.errors.length > 0 && (
        <ul className={cn(textClass.meta, "mt-3 list-disc space-y-1 pl-5 text-muted-foreground")}>
          {job.errors.slice(0, 10).map((error) => (
            <li key={`${error.row}-${error.message}`}>{error.message}</li>
          ))}
          {job.errors.length > 10 && <li>… e mais {job.errors.length - 10} linhas.</li>}
        </ul>
      )}
    </div>
  );
}
