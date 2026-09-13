import type { ImportPreview, ImportPreviewCell } from "@ecommerce/contracts/imports";
import { formatNumber } from "@ecommerce/contracts/shared/format";
import { Button } from "@/shared/ui/Button";
import { DataTable } from "@/shared/ui/DataTable";
import { radiusClass } from "@/shared/styles/radius";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { previewCell, previewSummaryText } from "./importPreviewFormat";

type Row = { id: number; cells: Record<string, ImportPreviewCell> };

export function ImportPreviewCard({
  preview,
  busy,
  onConfirm,
  onCancel,
}: {
  preview: ImportPreview;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const rows: Row[] = preview.sample.map((cells, id) => ({ id, cells }));
  const nothingValid = preview.counts.valid === 0;
  return (
    <div className={cn("border border-border bg-card p-4", radiusClass.card)} role="region">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <div className={cn(textClass.cardTitle, "text-foreground")}>Prévia da importação</div>
          <p className={cn(textClass.meta, "mt-1 text-muted-foreground")}>
            {previewSummaryText(preview.summary)} · {formatNumber(preview.counts.valid)} de{" "}
            {formatNumber(preview.counts.total)} linhas válidas
            {preview.counts.rejected > 0
              ? ` · ${formatNumber(preview.counts.rejected)} serão rejeitadas`
              : ""}
          </p>
        </div>
      </div>
      {preview.errors.length > 0 && (
        <ul className={cn(textClass.meta, "mt-3 list-disc space-y-1 pl-5 text-destructive")}>
          {preview.errors.slice(0, 10).map((error) => (
            <li key={`${error.row}-${error.message}`}>{error.message}</li>
          ))}
          {preview.errors.length > 10 && <li>… e mais {preview.errors.length - 10} linhas.</li>}
        </ul>
      )}
      <div className="mt-3">
        <DataTable
          columns={preview.columns.map((column) => ({
            key: column.key,
            header: column.header,
            align: column.type === "text" ? "left" : "right",
            render: (r: Row) => previewCell(r.cells[column.key] ?? null, column.type),
          }))}
          rows={rows}
          rowKey={(r) => String(r.id)}
          emptyMessage="Nenhuma linha válida para mostrar."
        />
      </div>
      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onCancel} disabled={busy}>
          Cancelar
        </Button>
        <Button onClick={onConfirm} disabled={busy || nothingValid}>
          {busy ? "Importando…" : `Importar ${formatNumber(preview.counts.valid)} linhas`}
        </Button>
      </div>
    </div>
  );
}
