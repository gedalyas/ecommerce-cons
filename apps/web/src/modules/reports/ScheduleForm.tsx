import { useState } from "react";
import {
  reportFrequencies,
  reportFrequencyLabel,
  type ReportRecipient,
  type ReportScheduleInput,
  type ReportSectionKey,
} from "@ecommerce/contracts/reports";
import { Button } from "@/shared/ui/Button";
import { FormField } from "@/shared/ui/FormField";
import { Input } from "@/shared/ui/Input";
import { MultiSelect } from "@/shared/ui/MultiSelect";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/Select";
import { layout } from "@/shared/styles/spacing";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { toggledSections } from "./reportBuilderRules";
import { dayOptions, hourOptions, withFrequency, type Option } from "./scheduleFormRules";
import { SectionChecklist } from "./SectionChecklist";

const frequencyOptions = reportFrequencies.map((key) => ({
  key,
  label: reportFrequencyLabel[key],
}));

function OptionSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  return (
    <FormField label={label}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
}

export function ScheduleForm({
  initial,
  available,
  recipients,
  busy,
  onSave,
  onCancel,
}: {
  initial: ReportScheduleInput;
  available: readonly ReportSectionKey[];
  recipients: ReportRecipient[];
  busy: boolean;
  onSave: (draft: ReportScheduleInput) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const patch = (next: Partial<ReportScheduleInput>) => setDraft((d) => ({ ...d, ...next }));
  const weekly = draft.frequency === "WEEKLY";
  const day = String((weekly ? draft.weekday : draft.monthDay) ?? 1);
  return (
    <div className={layout.groupStack}>
      <FormField label="Nome">
        <Input
          value={draft.name}
          maxLength={80}
          onChange={(e) => patch({ name: e.target.value })}
        />
      </FormField>
      <SegmentedControl
        options={frequencyOptions}
        value={draft.frequency}
        onChange={(frequency) => setDraft((d) => withFrequency(d, frequency))}
        label="Frequência"
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <OptionSelect
          label={weekly ? "Dia da semana" : "Dia do mês"}
          value={day}
          options={dayOptions(draft.frequency)}
          onChange={(v) => patch(weekly ? { weekday: Number(v) } : { monthDay: Number(v) })}
        />
        <OptionSelect
          label="Hora (horário da loja)"
          value={String(draft.hour)}
          options={hourOptions}
          onChange={(v) => patch({ hour: Number(v) })}
        />
      </div>
      <FormField label="Destinatários">
        <MultiSelect
          label="Destinatários"
          options={recipients.map((r) => ({ value: r.id, label: `${r.name} (${r.email})` }))}
          value={draft.recipientIds}
          onChange={(recipientIds) => patch({ recipientIds })}
        />
      </FormField>
      <SectionChecklist
        available={available}
        selected={draft.sections}
        onToggle={(key) => patch({ sections: toggledSections(draft.sections, key) })}
      />
      <label className={cn(textClass.body, "flex min-h-11 items-center gap-3")}>
        <input
          type="checkbox"
          className="h-4 w-4 accent-primary"
          checked={draft.enabled}
          onChange={(e) => patch({ enabled: e.target.checked })}
        />
        Ativa — enviar por e-mail com o PDF anexado
      </label>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onCancel} disabled={busy}>
          Cancelar
        </Button>
        <Button onClick={() => onSave(draft)} disabled={busy}>
          {busy ? "Salvando…" : "Salvar automação"}
        </Button>
      </div>
    </div>
  );
}
