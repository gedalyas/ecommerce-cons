import { cn } from "@/lib/utils";
import { radiusClass } from "../../tokens/radius";
import { textClass } from "../../tokens/typography";
import type { BadgeProps } from "./types";

const tones = {
  accent: "bg-primary text-primary-foreground",
  outline: "border border-primary text-primary",
  muted: "bg-muted text-muted-foreground",
  warning: "border border-border text-foreground",
} as const;

/** Badge de estado: 22px de altura, 11px semibold uppercase, raio 4px. */
export function Badge({ tone = "muted", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1 px-2.5 py-1 leading-none",
        radiusClass.badge,
        textClass.label,
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
