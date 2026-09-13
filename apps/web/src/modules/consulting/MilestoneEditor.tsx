import { useServerFn } from "@tanstack/react-start";
import { Pencil } from "lucide-react";
import { useState } from "react";
import type { MilestoneCriterion } from "@ecommerce/contracts/consulting";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { FormField } from "@/shared/ui/FormField";
import { Input } from "@/shared/ui/Input";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { updateMilestoneFn } from "./consultingController";
import { useEditRun } from "./useEditRun";

function CriterionForm({ criterion }: { criterion: MilestoneCriterion }) {
  const update = useServerFn(updateMilestoneFn);
  const { busy, error, run } = useEditRun();
  const [progress, setProgress] = useState(criterion.progress);
  const [achieved, setAchieved] = useState(criterion.achieved);
  const [note, setNote] = useState(criterion.note);
  return (
    <div className="grid gap-2 border-t border-border pt-3 sm:grid-cols-[1fr_5rem_auto_1fr_auto] sm:items-end">
      <div>
        <div className="text-[13px] font-semibold text-foreground">{criterion.name}</div>
        <div className={cn(textClass.meta, "text-muted-foreground")}>{criterion.hint}</div>
      </div>
      <FormField label="Progresso %">
        <Input
          type="number"
          min={0}
          max={100}
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
        />
      </FormField>
      <label className={cn(textClass.meta, "flex items-center gap-2 pb-2 text-foreground")}>
        <input type="checkbox" checked={achieved} onChange={(e) => setAchieved(e.target.checked)} />
        Atingido
      </label>
      <FormField label="Nota">
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={160}
          placeholder="Como está hoje"
        />
      </FormField>
      <Button
        size="sm"
        disabled={busy}
        onClick={() =>
          void run(() => update({ data: { key: criterion.key, progress, achieved, note } }))
        }
      >
        {busy ? "…" : "Salvar"}
      </Button>
      {error && (
        <p role="alert" className={cn(textClass.meta, "text-destructive sm:col-span-5")}>
          {error}
        </p>
      )}
    </div>
  );
}

export function MilestoneEditor({ criteria }: { criteria: MilestoneCriterion[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        aria-label="Editar marco de maturidade"
        onClick={() => setOpen(true)}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Marco de maturidade"
        description="Progresso e situação de cada critério, informados pela consultoria."
        className="max-w-2xl"
      >
        <div className="grid gap-2">
          {criteria.map((c) => (
            <CriterionForm key={c.key} criterion={c} />
          ))}
        </div>
      </Dialog>
    </>
  );
}
