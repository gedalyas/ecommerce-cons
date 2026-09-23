import { useState, type PointerEvent } from "react";
import { Info } from "lucide-react";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import type { MetricHint } from "./metricTile.types";

type Props = { label: string; hint: MetricHint; className?: string };

const isMouse = (event: PointerEvent) => event.pointerType === "mouse";

export function MetricHintButton({ label, hint, className }: Props) {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const handleOpenChange = (next: boolean) => {
    setPinned(next);
    if (!next) setHovered(false);
  };
  return (
    <Popover open={hovered || pinned} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        aria-label={`O que é ${label}?`}
        onPointerEnter={(event) => isMouse(event) && setHovered(true)}
        onPointerLeave={(event) => isMouse(event) && setHovered(false)}
        onClick={(event) => {
          event.preventDefault();
          setPinned((current) => !current);
        }}
        className={cn(
          "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
      >
        <Info className="h-3.5 w-3.5" aria-hidden />
      </PopoverTrigger>
      <PopoverContent side="top" className="flex w-72 flex-col gap-2">
        <span className={cn(textClass.meta, "font-semibold text-foreground")}>{label}</span>
        <span className={cn(textClass.meta, "text-foreground")}>{hint.definition}</span>
        <span className={cn(textClass.meta, "text-muted-foreground")}>{hint.formula}</span>
      </PopoverContent>
    </Popover>
  );
}
