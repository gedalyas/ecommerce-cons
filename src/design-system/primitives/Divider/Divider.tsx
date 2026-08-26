import { cn } from "@/lib/utils";
import type { DividerProps } from "./types";

/** Divisória de 1px na cor de borda do sistema. */
export function Divider({ orientation = "horizontal", className }: DividerProps) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        "bg-border",
        orientation === "horizontal" ? "h-px w-full" : "w-px self-stretch",
        className,
      )}
    />
  );
}
