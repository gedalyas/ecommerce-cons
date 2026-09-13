import {
  auditActionLabel,
  type ActivityEntry,
  type ActivityPage,
} from "@ecommerce/contracts/audit";
import { userRoleLabel } from "@ecommerce/contracts/auth";
import { formatDate } from "@ecommerce/contracts/shared/format";
import { DataTable } from "@/shared/ui/DataTable";
import type { DataTableColumn } from "@/shared/ui/DataTable";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";

const when = (iso: string) =>
  formatDate(iso, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

const baseColumns: DataTableColumn<ActivityEntry>[] = [
  {
    key: "when",
    header: "Quando",
    render: (r) => when(r.createdAt),
    className: "whitespace-nowrap",
  },
  {
    key: "who",
    header: "Quem",
    render: (r) => (
      <span>
        {r.actorName}
        <span className={cn(textClass.meta, "ml-1 text-muted-foreground")}>
          {r.actorRole ? userRoleLabel[r.actorRole].toLowerCase() : "sistema"}
        </span>
      </span>
    ),
  },
  {
    key: "what",
    header: "O que",
    render: (r) => auditActionLabel[r.action],
    className: "whitespace-nowrap",
  },
  { key: "summary", header: "Detalhe", render: (r) => r.summary },
];

const storeColumn: DataTableColumn<ActivityEntry> = {
  key: "store",
  header: "Loja",
  render: (r) => r.storeName ?? "—",
  className: "whitespace-nowrap",
};

export function ActivityTable({
  activity,
  withStore,
  onPage,
}: {
  activity: ActivityPage;
  withStore: boolean;
  onPage: (page: number) => void;
}) {
  return (
    <DataTable
      columns={withStore ? [baseColumns[0]!, storeColumn, ...baseColumns.slice(1)] : baseColumns}
      rows={activity.entries}
      rowKey={(r) => r.id}
      remote={{
        page: activity.page,
        pageSize: activity.pageSize,
        total: activity.total,
        sort: null,
        onChange: (next) => onPage(next.page),
      }}
      emptyMessage="Nenhuma atividade registrada ainda."
    />
  );
}
