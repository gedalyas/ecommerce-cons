/**
 * Cores nomeadas por função. Fonte única de verdade.
 * Cada token expõe o valor bruto (espelho das variáveis em styles.css)
 * e a classe utilitária correspondente, que é o que os componentes usam.
 */
export const color = {
  background: "#FAFAFA",
  surface: "#F3F4F6",
  card: "#FFFFFF",
  textPrimary: "#1A1D21",
  textSecondary: "#6B7280",
  textDisabled: "#9CA3AF",
  border: "#E5E7EB",
  borderStrong: "#D1D5DB",
  accent: "#0F6E56",
  accentContrast: "#FFFFFF",
  accentSoft: "#F5FAF8",
  warning: "#B45309",
  warningSoft: "#FDF6EC",
  negative: "#B91C1C",
} as const;

export const colorClass = {
  background: "bg-background",
  surface: "bg-muted",
  card: "bg-card",
  textPrimary: "text-foreground",
  textSecondary: "text-muted-foreground",
  textDisabled: "text-chart-4",
  border: "border-border",
  borderStrong: "border-border-strong",
  accent: "text-primary",
  accentBg: "bg-primary",
  accentContrast: "text-primary-foreground",
  accentSoft: "bg-success-soft",
  warning: "text-warning",
  warningBorder: "border-l-warning",
  warningSoft: "bg-warning-soft",
  negative: "text-destructive",
} as const;

export type ColorToken = keyof typeof color;
