import { cn } from "@/lib/utils";
import { radiusClass } from "../../tokens/radius";
import { shadowClass } from "../../tokens/shadows";
import type { CardProps } from "./types";

const tones = {
  default: "border-border bg-card",
  warning: "border-border border-l-[3px] border-l-warning bg-card",
  highlight: "border-primary bg-success-soft",
  muted: "border-border bg-muted/40",
} as const;

/** The single container carrying border, 8px radius and shadow-sm. */
export function Card({ tone = "default", className, children }: CardProps) {
  return (
    <section
      className={cn(
        "overflow-hidden border",
        radiusClass.card,
        shadowClass.sm,
        tones[tone],
        className,
      )}
    >
      {children}
    </section>
  );
}
