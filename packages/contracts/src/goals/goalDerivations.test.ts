import { describe, expect, it } from "vitest";
import {
  deriveGoal,
  elapsedPercent,
  monthShares,
  pacingOf,
  prorateGoals,
  progressOf,
} from "./goalDerivations";

const january = {
  month: 1,
  totalSold: 500_000,
  averageTicket: 250,
  conversionRate: 2,
  paidTraffic: 100_000,
  otherMarketing: 5_000,
  repurchaseRate: 20,
};

describe("deriveGoal", () => {
  it("derives the eight KPIs of the Prax planning grid", () => {
    const v = deriveGoal(january);
    expect(v.orders).toBe(2_000);
    expect(v.sessions).toBe(100_000);
    expect(v.roas).toBe(5);
    expect(v.totalMarketing).toBe(105_000);
    expect(v.roi).toBeCloseTo(376.19, 2);
    expect(v.cpa).toBe(52.5);
    expect(v.newCustomers).toBe(1_600);
    expect(v.cac).toBeCloseTo(21, 2);
    expect(v.costPerSession).toBe(1.05);
    expect(v.revenuePerSession).toBe(5);
  });

  it("is null-safe when a driver is zero", () => {
    const v = deriveGoal({ ...january, averageTicket: 0, paidTraffic: 0 });
    expect(v.orders).toBe(0);
    expect(v.roas).toBeNull();
    expect(v.averageTicket).toBeNull();
  });
});

describe("monthShares", () => {
  it("splits a window across months by days", () => {
    expect(monthShares("2026-01-20", "2026-02-10")).toEqual([
      { year: 2026, month: 1, share: 12 / 31 },
      { year: 2026, month: 2, share: 10 / 28 },
    ]);
  });

  it("covers a whole month with share 1", () => {
    expect(monthShares("2026-03-01", "2026-03-31")).toEqual([{ year: 2026, month: 3, share: 1 }]);
  });
});

describe("prorateGoals", () => {
  const plans = new Map([
    ["2026-1", january],
    ["2026-2", { ...january, month: 2, totalSold: 280_000 }],
  ]);

  it("sums the additive drivers by month share and rebuilds the ratios", () => {
    const v = prorateGoals(plans, "2026-01-01", "2026-02-28")!;
    expect(v.totalSold).toBe(780_000);
    expect(v.orders).toBe(2_000 + 1_120);
    expect(v.averageTicket).toBe(250);
    expect(v.conversionRate).toBeCloseTo(2, 6);
  });

  it("prorates a partial month", () => {
    const v = prorateGoals(plans, "2026-01-01", "2026-01-15")!;
    expect(v.totalSold).toBeCloseTo((500_000 * 15) / 31, 6);
  });

  it("is null when no month of the window has a goal", () => {
    expect(prorateGoals(plans, "2026-05-01", "2026-05-31")).toBeNull();
  });
});

describe("pacing", () => {
  it("expects the elapsed share for additive metrics and the whole goal for ratios", () => {
    expect(elapsedPercent("2026-09-01", "2026-09-30", "2026-09-10")).toBeCloseTo(33.33, 2);
    expect(elapsedPercent("2026-09-01", "2026-09-30", "2026-10-05")).toBe(100);
    expect(pacingOf(true, 33.3)).toBeCloseTo(33.3, 6);
    expect(pacingOf(false, 33.3)).toBe(100);
    expect(progressOf(250, 500)).toBe(50);
    expect(progressOf(250, 0)).toBeNull();
  });
});
