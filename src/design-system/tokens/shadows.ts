/** sm em repouso, md em hover/overlay, lg em drawer/modal. */
export const shadow = {
  sm: "0 1px 2px rgba(16, 24, 40, 0.04)",
  md: "0 4px 12px rgba(16, 24, 40, 0.08)",
  lg: "0 12px 32px rgba(16, 24, 40, 0.12)",
  /** sombra de rolagem: gradiente de 24px */
  scroll: "linear-gradient(to bottom, rgba(16, 24, 40, 0.08), rgba(16, 24, 40, 0))",
} as const;

export const shadowClass = {
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
  scrollTop: "scroll-shadow-top",
  scrollBottom: "scroll-shadow-bottom",
} as const;
