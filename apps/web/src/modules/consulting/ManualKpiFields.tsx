import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import type { ConsultingMetric } from "@ecommerce/contracts/consulting";
import { Button } from "@/shared/ui/Button";
import { FormField } from "@/shared/ui/FormField";
import { Input } from "@/shared/ui/Input";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { setManualKpiFn } from "./consultingController";
import { useEditRun } from "./useEditRun";

type ManualMetric = Extract<ConsultingMetric, { source: "manual" }>;

function ManualKpiRow({ pillarKey, kpi }: { pillarKey: string; kpi: ManualMetric }) {
  const save = useServerFn(setManualKpiFn);
  const { busy, error, run } = useEditRun();
  const [value, setValue] = useState(kpi.manual?.value ?? "");
  const [delta, setDelta] = useState(kpi.manual?.delta ?? "");
  const [note, setNote] = useState(kpi.manual?.note ?? "");
  return (
    <div className="grid gap-2 border-t border-border pt-3 sm:grid-cols-[1fr_6rem_1fr_auto] sm:items-end">
      <FormField label={kpi.label}>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={kpi.hint}
          maxLength={40}
        />
      </FormField>
      <FormField label="Variação">
        <Input
          value={delta}
          onChange={(e) => setDelta(e.target.value)}
          placeholder="+2 pp"
          maxLength={20}
        />
      </FormField>
      <FormField label="Nota">
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Fonte do número"
          maxLength={160}
        />
      </FormField>
      <Button
        size="sm"
        disabled={busy || value.trim() === ""}
        onClick={() =>
          void run(() =>
            save({
              data: {
                pillarKey,
                kpiKey: kpi.key,
                value,
                delta: delta.trim() || null,
                fidelity: kpi.fidelity ?? "B",
                note,
              },
            }),
          )
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

export function ManualKpiFields({ pillarKey, kpis }: { pillarKey: string; kpis: ManualMetric[] }) {
  return (
    <div>
      <div className={cn(textClass.label, "text-muted-foreground")}>Indicadores informados</div>
      {kpis.map((kpi) => (
        <ManualKpiRow key={kpi.key} pillarKey={pillarKey} kpi={kpi} />
      ))}
    </div>
  );
}
