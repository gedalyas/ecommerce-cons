import { cn } from "@/lib/utils";
import { shadowClass } from "../../tokens/shadows";
import type { ScrollShadowsProps } from "./types";

/** Gradientes fixos nas bordas de uma área rolável. */
export function ScrollShadows({ top, bottom }: ScrollShadowsProps) {
  return (
    <>
      <div
        aria-hidden="true"
        className={cn(
          shadowClass.scrollTop,
          "pointer-events-none absolute inset-x-0 top-0 z-10 h-6 transition-opacity duration-200",
          top ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          shadowClass.scrollBottom,
          "pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 backdrop-blur-[1px] transition-opacity duration-200",
          bottom ? "opacity-100" : "opacity-0",
        )}
      />
    </>
  );
}
