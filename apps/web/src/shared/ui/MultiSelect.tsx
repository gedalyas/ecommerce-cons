import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import { cn } from "@/shared/utils/cn";
import { textClass } from "@/shared/styles/typography";

export type MultiSelectOption = { value: string; label: string };

/**
 * Filter dropdown with search, "Selecionar todos" and a checkbox per option.
 * Options are the values that exist in the current period, so no selection
 * ever yields an empty table by construction.
 */
export function MultiSelect({
  label,
  options,
  value,
  onChange,
  className,
}: {
  label: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (next: string[]) => void;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const visible = options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));
  const selected = new Set(value);
  const allSelected = options.length > 0 && options.every((o) => selected.has(o.value));

  const toggle = (v: string) =>
    onChange(selected.has(v) ? value.filter((x) => x !== v) : [...value, v]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-9 gap-2 font-normal shadow-none",
            value.length > 0 && "border-primary",
            className,
          )}
        >
          {label}
          {value.length > 0 && (
            <span
              className={cn(
                textClass.numeric,
                "rounded-sm bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground",
              )}
            >
              {value.length}
            </span>
          )}
          <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pesquisar…"
          aria-label={`Pesquisar ${label}`}
          className="h-8"
        />
        <div className="mt-2 flex items-center justify-between px-1">
          <button
            type="button"
            className={cn(textClass.meta, "text-primary hover:underline")}
            onClick={() => onChange(allSelected ? [] : options.map((o) => o.value))}
          >
            {allSelected ? "Limpar seleção" : "Selecionar todos"}
          </button>
          <span className={cn(textClass.meta, textClass.numeric, "text-muted-foreground")}>
            {options.length}
          </span>
        </div>
        <ul className="mt-1 max-h-60 overflow-y-auto">
          {visible.length === 0 && (
            <li className={cn(textClass.meta, "px-2 py-3 text-center text-muted-foreground")}>
              Nenhum resultado encontrado
            </li>
          )}
          {visible.map((o) => {
            const active = selected.has(o.value);
            return (
              <li key={o.value}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={active}
                  onClick={() => toggle(o.value)}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[13px] leading-[18px] hover:bg-muted"
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border-strong",
                    )}
                  >
                    {active && <Check className="h-3 w-3" aria-hidden />}
                  </span>
                  <span className="truncate">{o.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
