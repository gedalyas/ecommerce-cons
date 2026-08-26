import { breakpoints } from "@/design-system/tokens/breakpoints";
import { useBreakpoint } from "@/design-system/hooks/useBreakpoint";

/** Compatibilidade com os componentes shadcn: usa o breakpoint md do design system. */
export function useIsMobile() {
  return !useBreakpoint("md");
}

export const MOBILE_BREAKPOINT = breakpoints.md;
