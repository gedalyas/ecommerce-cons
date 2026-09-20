import { cn } from "@/shared/utils/cn";
import { shadowClass } from "@/shared/styles/shadows";
import type { ScrollShadowsProps } from "./scrollShadow.types";

export type { ScrollShadowsProps } from "./scrollShadow.types";

export function ScrollShadows({ bottom }: ScrollShadowsProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        shadowClass.scrollBottom,
        "pointer-events-none sticky bottom-0 z-10 -mt-16 h-16 w-full backdrop-blur-[1px] transition-opacity duration-200",
        bottom ? "opacity-100" : "opacity-0",
      )}
    />
  );
}
