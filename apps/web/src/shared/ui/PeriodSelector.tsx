import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { ptBR } from "date-fns/locale";
import type { DateRange as PickerRange } from "react-day-picker";
import { Button } from "./Button";
import { Calendar } from "@/shared/ui/Calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/Popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/Select";
import { useBreakpoint } from "@/shared/hooks/useBreakpoint";
import { cn } from "@/shared/utils/cn";
import { formatPeriodLabel } from "@ecommerce/contracts/shared/format";
import {
  channelLabel,
  channels,
  comparisonLabel,
  comparisons,
  fromIsoDate,
  granularities,
  granularityLabel,
  matchingPreset,
  periodPresets,
  resolveComparison,
  toIsoDate,
  type PeriodSearch,
} from "@ecommerce/contracts/shared/period";
import { todayIso } from "@ecommerce/contracts/shared/clock";
import { textClass } from "@/shared/styles/typography";
import type { PeriodSelectorProps } from "./periodSelector.types";

export type { PeriodSelectorProps } from "./periodSelector.types";

function QuickPeriods({
  activeKey,
  onPick,
}: {
  activeKey: string | undefined;
  onPick: (key: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-border p-3 sm:w-44 sm:border-b-0 sm:border-l">
      <div className={cn(textClass.meta, "mb-1 font-semibold text-foreground")}>
        Períodos rápidos
      </div>
      <ul className="flex flex-wrap gap-1 sm:flex-col">
        {periodPresets.map((preset) => (
          <li key={preset.key}>
            <button
              type="button"
              onClick={() => onPick(preset.key)}
              className={cn(
                textClass.meta,
                "w-full whitespace-nowrap rounded-md px-3 py-1.5 text-left transition-colors duration-150 hover:bg-muted max-sm:border max-sm:border-border",
                preset.key === activeKey && "bg-success-soft font-semibold text-primary",
              )}
            >
              {preset.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DraftOptions({
  draft,
  onChange,
}: {
  draft: PeriodSearch;
  onChange: (patch: Partial<PeriodSearch>) => void;
}) {
  const field = (label: string, control: React.ReactNode) => (
    <label className="flex min-w-0 flex-1 flex-col gap-1">
      <span className={cn(textClass.meta, "text-muted-foreground")}>{label}</span>
      {control}
    </label>
  );
  return (
    <div className="grid gap-3 border-t border-border p-3 sm:flex sm:flex-wrap">
      {field(
        "Agrupar por",
        <Select
          value={draft.por}
          onValueChange={(por) => onChange({ por: por as PeriodSearch["por"] })}
        >
          <SelectTrigger className="h-9 shadow-none" aria-label="Agrupar por">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {granularities.map((g) => (
              <SelectItem key={g} value={g}>
                {granularityLabel[g]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>,
      )}
      {field(
        "Comparar com",
        <Select
          value={draft.comparar}
          onValueChange={(comparar) => onChange({ comparar: comparar as PeriodSearch["comparar"] })}
        >
          <SelectTrigger className="h-9 shadow-none" aria-label="Comparar com">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {comparisons.map((c) => (
              <SelectItem key={c} value={c}>
                {comparisonLabel[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>,
      )}
      {field(
        "Canal",
        <Select
          value={draft.canal}
          onValueChange={(canal) => onChange({ canal: canal as PeriodSearch["canal"] })}
        >
          <SelectTrigger className="h-9 shadow-none" aria-label="Canal de venda">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {channels.map((c) => (
              <SelectItem key={c} value={c}>
                {channelLabel[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>,
      )}
    </div>
  );
}

export function PeriodSelector({
  value,
  onChange,
  today = todayIso(),
  className,
}: PeriodSelectorProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<PeriodSearch>(value);
  const [picked, setPicked] = useState<PickerRange | undefined>();
  const wide = useBreakpoint("sm");

  const todayDate = fromIsoDate(today);
  const draftPreset = matchingPreset(draft, todayDate);
  const comparison = resolveComparison(draft);
  const patchDraft = (patch: Partial<PeriodSearch>) => setDraft((prev) => ({ ...prev, ...patch }));

  const openWith = (next: boolean) => {
    if (next) setDraft(value);
    setPicked(undefined);
    setOpen(next);
  };

  const pickRange = (range: PickerRange | undefined) => {
    setPicked(range);
    if (!range?.from) return;
    patchDraft({ inicio: toIsoDate(range.from), fim: toIsoDate(range.to ?? range.from) });
  };

  const pickPreset = (key: string) => {
    const preset = periodPresets.find((p) => p.key === key);
    if (!preset) return;
    setPicked(undefined);
    patchDraft(preset.range(todayDate));
  };

  const apply = () => {
    onChange(draft);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={openWith}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-9 gap-1 px-2 font-normal", className)}
          aria-label="Período e filtros"
        >
          <span className={textClass.numeric}>
            {formatPeriodLabel(value.inicio, value.fim, true)}
          </span>
          {open ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        collisionPadding={16}
        className="max-h-(--radix-popover-content-available-height) w-auto max-w-[calc(100vw-32px)] overflow-y-auto p-0"
      >
        <div className="flex flex-col sm:flex-row">
          <div className="p-2 max-sm:mx-auto">
            <Calendar
              mode="range"
              locale={ptBR}
              numberOfMonths={wide ? 2 : 1}
              defaultMonth={fromIsoDate(draft.inicio)}
              selected={picked ?? { from: fromIsoDate(draft.inicio), to: fromIsoDate(draft.fim) }}
              onSelect={pickRange}
              disabled={{ after: todayDate }}
              showOutsideDays={false}
            />
          </div>
          <QuickPeriods activeKey={draftPreset} onPick={pickPreset} />
        </div>
        <DraftOptions draft={draft} onChange={patchDraft} />
        <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-2 border-t border-border bg-popover p-3">
          <span className={cn(textClass.meta, textClass.numeric, "text-muted-foreground")}>
            {formatPeriodLabel(draft.inicio, draft.fim, true)}
            {comparison
              ? ` · vs ${formatPeriodLabel(comparison.inicio, comparison.fim, true)}`
              : " · sem comparação"}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={apply}>
              Aplicar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
