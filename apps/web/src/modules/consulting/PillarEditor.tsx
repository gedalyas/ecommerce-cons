import { useServerFn } from "@tanstack/react-start";
import { Pencil } from "lucide-react";
import { useState } from "react";
import {
  pillarStatusLabel,
  pillarStatuses,
  type ConsultingPillar,
  type PillarStatusKey,
} from "@ecommerce/contracts/consulting";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { FormField } from "@/shared/ui/FormField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/Select";
import { Textarea } from "@/shared/ui/Textarea";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { updatePillarFn } from "./consultingController";
import { ManualKpiFields } from "./ManualKpiFields";
import { useEditRun } from "./useEditRun";
import { RecommendationEditor } from "./RecommendationEditor";

function PillarStatusForm({ pillar }: { pillar: ConsultingPillar }) {
  const update = useServerFn(updatePillarFn);
  const { busy, error, run } = useEditRun();
  const [status, setStatus] = useState<PillarStatusKey>(pillar.status);
  const [dataPending, setDataPending] = useState(pillar.dataPending ?? "");
  const dirty = status !== pillar.status || dataPending !== (pillar.dataPending ?? "");
  return (
    <div className="grid gap-3 sm:grid-cols-[12rem_1fr] sm:items-end">
      <FormField label="Status do pilar">
        <Select value={status} onValueChange={(v) => setStatus(v as PillarStatusKey)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pillarStatuses.map((s) => (
              <SelectItem key={s} value={s}>
                {pillarStatusLabel[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField label="Pendências de dado">
        <Textarea
          value={dataPending}
          onChange={(e) => setDataPending(e.target.value)}
          rows={2}
          maxLength={250}
          placeholder="O que falta para fechar este pilar"
        />
      </FormField>
      {error && (
        <p role="alert" className={cn(textClass.meta, "text-destructive sm:col-span-2")}>
          {error}
        </p>
      )}
      <div className="flex justify-end sm:col-span-2">
        <Button
          size="sm"
          disabled={!dirty || busy}
          onClick={() =>
            void run(() => update({ data: { pillarKey: pillar.key, status, dataPending } }))
          }
        >
          {busy ? "Salvando…" : "Salvar status"}
        </Button>
      </div>
    </div>
  );
}

export function PillarEditor({ pillar }: { pillar: ConsultingPillar }) {
  const [open, setOpen] = useState(false);
  const manualKpis = pillar.kpis.filter((k) => k.source === "manual");
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        aria-label={`Editar ${pillar.title}`}
        onClick={() => setOpen(true)}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={`Acompanhamento · ${pillar.title}`}
        description="Status, indicadores informados e recomendações deste pilar."
        className="max-w-2xl"
      >
        <div className="grid gap-6">
          <PillarStatusForm pillar={pillar} />
          {manualKpis.length > 0 && <ManualKpiFields pillarKey={pillar.key} kpis={manualKpis} />}
          <RecommendationEditor pillar={pillar} />
        </div>
      </Dialog>
    </>
  );
}
