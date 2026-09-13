import {
  importKindLabel,
  importStatusLabel,
  type ImportJob,
  type ImportStatus,
} from "@ecommerce/contracts/imports";
import { formatDate, formatNumber } from "@ecommerce/contracts/shared/format";
import { Badge } from "@/shared/ui/Badge";
import type { BadgeTone } from "@/shared/ui/badge.types";
import type { DataTableColumn } from "@/shared/ui/DataTable";

export const importStatusTone: Record<ImportStatus, BadgeTone> = {
  DONE: "accent",
  PARTIAL: "warning",
  FAILED: "outline",
  UNDONE: "muted",
};

export const importHistoryColumns: DataTableColumn<ImportJob>[] = [
  {
    key: "createdAt",
    header: "Quando",
    render: (r) =>
      formatDate(r.createdAt, {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
    sortValue: (r) => r.createdAt,
    className: "whitespace-nowrap",
  },
  { key: "kind", header: "Tipo", render: (r) => importKindLabel[r.kind] },
  { key: "fileName", header: "Arquivo", render: (r) => r.fileName, className: "max-w-56 truncate" },
  {
    key: "status",
    header: "Status",
    render: (r) => <Badge tone={importStatusTone[r.status]}>{importStatusLabel[r.status]}</Badge>,
  },
  {
    key: "rows",
    header: "Linhas",
    align: "right",
    render: (r) => `${formatNumber(r.rowsImported)} / ${formatNumber(r.rowsTotal)}`,
    sortValue: (r) => r.rowsImported,
  },
  {
    key: "rejected",
    header: "Rejeitadas",
    align: "right",
    render: (r) => formatNumber(r.rowsRejected),
    sortValue: (r) => r.rowsRejected,
  },
];
