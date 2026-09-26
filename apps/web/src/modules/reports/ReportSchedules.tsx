import { Pencil, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  scheduleLabel,
  type ReportSchedule,
  type ReportSectionKey,
} from "@ecommerce/contracts/reports";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/Tooltip";
import { layout } from "@/shared/styles/spacing";
import { radiusClass } from "@/shared/styles/radius";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { templateSectionsFor } from "./reportBuilderRules";
import { draftOf } from "./scheduleFormRules";
import { ScheduleForm } from "./ScheduleForm";
import { useReportSchedules } from "./useReportSchedules";

type Editing = { schedule: ReportSchedule | null } | null;

function IconAction({
  label,
  onClick,
  icon,
}: {
  label: string;
  onClick: () => void;
  icon: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={label} onClick={onClick}>
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function ReportSchedules({ available }: { available: readonly ReportSectionKey[] }) {
  const { screen, message, busy, save, remove } = useReportSchedules();
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<ReportSchedule | null>(null);
  const me = screen?.recipients[0]?.id ?? "";

  if (!screen) {
    return (
      <p className={cn(textClass.meta, layout.cardPadding, "text-muted-foreground")}>
        {message ?? "Carregando automações…"}
      </p>
    );
  }
  return (
    <div className={cn(layout.cardPadding, layout.groupStack)}>
      <p className={cn(textClass.meta, "text-muted-foreground")}>
        Receba o relatório por e-mail, com um resumo no corpo e o PDF anexado. Semanal: a semana
        anterior; mensal: o mês anterior.
      </p>
      {message && (
        <p role="alert" className={cn(textClass.meta, "text-destructive")}>
          {message}
        </p>
      )}
      {editing ? (
        <ScheduleForm
          initial={draftOf(editing.schedule, templateSectionsFor("weekly", available), me)}
          available={available}
          recipients={screen.recipients}
          busy={busy}
          onCancel={() => setEditing(null)}
          onSave={(draft) =>
            void save(editing.schedule?.id ?? null, draft).then((ok) => ok && setEditing(null))
          }
        />
      ) : (
        <>
          {screen.schedules.length === 0 && (
            <p className={cn(textClass.body, "text-muted-foreground")}>Nenhuma automação ainda.</p>
          )}
          <ul className={layout.groupStack}>
            {screen.schedules.map((s) => (
              <li
                key={s.id}
                className={cn("flex items-center gap-3 border border-border p-3", radiusClass.card)}
              >
                <div className="min-w-0 flex-1">
                  <div className={cn(textClass.body, "truncate font-semibold")}>{s.name}</div>
                  <div className={cn(textClass.meta, "text-muted-foreground")}>
                    {scheduleLabel(s)} · {s.recipientIds.length} destinatário(s)
                  </div>
                </div>
                {!s.enabled && <Badge tone="muted">Pausada</Badge>}
                <IconAction
                  label="Editar"
                  icon={<Pencil className="h-4 w-4" />}
                  onClick={() => setEditing({ schedule: s })}
                />
                <IconAction
                  label="Excluir"
                  icon={<Trash2 className="h-4 w-4" />}
                  onClick={() => setDeleting(s)}
                />
              </li>
            ))}
          </ul>
          <div className="flex justify-end">
            <Button
              onClick={() => setEditing({ schedule: null })}
              className="h-11 w-full md:h-9 md:w-auto"
            >
              Nova automação
            </Button>
          </div>
        </>
      )}
      <Dialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Excluir automação"
        description={deleting ? `"${deleting.name}" deixa de ser enviada.` : undefined}
      >
        <div className="flex justify-end gap-2 p-4">
          <Button variant="outline" onClick={() => setDeleting(null)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={busy}
            onClick={() => deleting && void remove(deleting.id).then(() => setDeleting(null))}
          >
            Excluir
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
