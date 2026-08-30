import { cn } from "@/lib/utils";
import type { DividerProps } from "./types";

/** 1px divider in the system border color. */
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
