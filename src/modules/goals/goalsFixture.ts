import type { GoalMonth } from "./goals.types";

/**
 * Loja Aurora's 2026 plan, seeded so the Resumo tab has goals to compare
 * with. Numbers follow the seed's seasonality (Black Friday in November,
 * a slow start of the year) with a ~10% growth ambition on the base.
 */
const totalSold = [
  430_000, 410_000, 470_000, 480_000, 520_000, 500_000, 500_000, 520_000, 530_000, 540_000, 680_000,
  590_000,
];

export const goalsPlan2026: GoalMonth[] = totalSold.map((sold, i) => ({
  month: i + 1,
  totalSold: sold,
  averageTicket: 265,
  conversionRate: 2,
  paidTraffic: Math.round(sold * 0.19),
  otherMarketing: 5_100,
  repurchaseRate: 16,
}));
