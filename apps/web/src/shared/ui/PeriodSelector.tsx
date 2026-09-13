import { CalendarDays } from "lucide-react";
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

/**
 * The single period control every data screen shares: date range (presets or
 * a two-month calendar), "por" granularity and "comparar com" window.
 */
export function PeriodSelector({
  value,
  onChange,
  today = todayIso(),
  className,
}: PeriodSelectorProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<PickerRange | undefined>();
  const wide = useBreakpoint("sm");

  const todayDate = fromIsoDate(today);
  const presetKey = matchingPreset(value, todayDate);
  const presetLabel = periodPresets.find((p) => p.key === presetKey)?.label;
  const comparison = resolveComparison(value);

  const draftRange =
    draft?.from && draft.to ? { inicio: toIsoDate(draft.from), fim: toIsoDate(draft.to) } : null;

  const applyPreset = (key: string) => {
    const preset = periodPresets.find((p) => p.key === key);
    if (!preset) return;
    onChange(preset.range(todayDate));
    setDraft(undefined);
    setOpen(false);
  };

  const applyDraft = () => {
    if (!draftRange) return;
    onChange(draftRange);
    setDraft(undefined);
    setOpen(false);
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setDraft(undefined);
        }}
      >
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-2 font-normal shadow-none">
            <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden />
            <span className={textClass.numeric}>{formatPeriodLabel(value.inicio, value.fim)}</span>
            {presetLabel && <span className="text-muted-foreground">· {presetLabel}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto max-w-[calc(100vw-32px)] p-0">
          <div className="flex flex-col sm:flex-row">
            <ul className="flex gap-1 overflow-x-auto border-b border-border p-2 sm:w-44 sm:flex-col sm:overflow-visible sm:border-b-0 sm:border-r">
              {periodPresets.map((preset) => (
                <li key={preset.key} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => applyPreset(preset.key)}
                    className={cn(
                      "w-full whitespace-nowrap rounded-md px-3 py-1.5 text-left text-[13px] leading-[18px] transition-colors duration-150 hover:bg-muted",
                      preset.key === presetKey &&
                        !draft &&
                        "bg-success-soft font-semibold text-primary",
                    )}
                  >
                    {preset.label}
                  </button>
                </li>
              ))}
            </ul>
            <div className="p-2">
              <Calendar
                mode="range"
                locale={ptBR}
                numberOfMonths={wide ? 2 : 1}
                defaultMonth={fromIsoDate(value.inicio)}
                selected={draft ?? { from: fromIsoDate(value.inicio), to: fromIsoDate(value.fim) }}
                onSelect={setDraft}
                disabled={{ after: todayDate }}
                showOutsideDays={false}
              />
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-2 pt-3">
                <span className={cn(textClass.meta, textClass.numeric, "text-muted-foreground")}>
                  {draftRange
                    ? formatPeriodLabel(draftRange.inicio, draftRange.fim)
                    : comparison
                      ? `Comparando com ${formatPeriodLabel(comparison.inicio, comparison.fim)}`
                      : "Sem comparação"}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDraft(undefined);
                      setOpen(false);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={applyDraft} disabled={!draftRange}>
                    Aplicar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <label className="flex items-center gap-2">
        <span className={cn(textClass.meta, "text-muted-foreground")}>por</span>
        <Select
          value={value.por}
          onValueChange={(por) => onChange({ por: por as PeriodSearch["por"] })}
        >
          <SelectTrigger className="h-9 w-[104px] shadow-none" aria-label="Agrupar por">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {granularities.map((g) => (
              <SelectItem key={g} value={g}>
                {granularityLabel[g]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <label className="flex items-center gap-2">
        <span className={cn(textClass.meta, "text-muted-foreground")}>comparar com</span>
        <Select
          value={value.comparar}
          onValueChange={(comparar) => onChange({ comparar: comparar as PeriodSearch["comparar"] })}
        >
          <SelectTrigger className="h-9 w-[160px] shadow-none" aria-label="Comparar com">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {comparisons.map((c) => (
              <SelectItem key={c} value={c}>
                {comparisonLabel[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
    </div>
  );
}
