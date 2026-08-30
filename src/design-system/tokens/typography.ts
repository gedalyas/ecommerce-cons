/** Exactly 6 sizes. Allowed weights: 400 and 600. */
export const typography = {
  label: {
    size: 11,
    lineHeight: 16,
    weight: 600,
    letterSpacing: "0.04em",
    transform: "uppercase",
    className: "t-label",
  },
  meta: { size: 13, lineHeight: 18, weight: 400, letterSpacing: "0", className: "t-meta" },
  body: { size: 15, lineHeight: 24, weight: 400, letterSpacing: "0", className: "t-body" },
  cardTitle: {
    size: 17,
    lineHeight: 24,
    weight: 600,
    letterSpacing: "0",
    className: "t-card-title",
  },
  sectionTitle: {
    size: 24,
    lineHeight: 32,
    weight: 600,
    letterSpacing: "-0.01em",
    className: "t-section-title",
  },
  kpi: { size: 32, lineHeight: 40, weight: 600, letterSpacing: "-0.02em", className: "t-kpi" },
} as const;

export const textClass = {
  label: typography.label.className,
  meta: typography.meta.className,
  body: typography.body.className,
  cardTitle: typography.cardTitle.className,
  sectionTitle: typography.sectionTitle.className,
  kpi: typography.kpi.className,
  /** numbers with lining-nums (avoids the fake gap in Manrope's comma) */
  numeric: "num",
} as const;

export type TypographyToken = keyof typeof typography;
