export const reportPalette = {
  foreground: "#1a1d21",
  muted: "#6b7280",
  border: "#e5e7eb",
  grid: "#f3f4f6",
  primary: "#0f6e56",
  destructive: "#b91c1c",
  series: ["#0f6e56", "#b45309", "#6b7280", "#9ca3af", "#d1d5db"],
} as const;

export type ReportPalette = typeof reportPalette;
