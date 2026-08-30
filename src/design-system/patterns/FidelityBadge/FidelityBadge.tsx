import { Tooltip, TooltipContent, TooltipTrigger } from "../../primitives/Tooltip";
import { radiusClass } from "../../tokens/radius";
import { cn } from "@/lib/utils";
import type { FidelityBadgeProps } from "./types";

const sealStyles = {
  A: "bg-primary text-primary-foreground",
  B: "border border-primary text-primary",
  C: "bg-muted text-chart-4",
} as const;

/** 16x16px A/B/C seal, 4px radius, 10px semibold, with an explanatory tooltip. */
export function FidelityBadge({ fidelity, note }: FidelityBadgeProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className={cn(
            "inline-flex h-4 w-4 shrink-0 cursor-default items-center justify-center text-[10px] font-semibold leading-none",
            radiusClass.badge,
            sealStyles[fidelity],
          )}
        >
          {fidelity}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">{note}</TooltipContent>
    </Tooltip>
  );
}
