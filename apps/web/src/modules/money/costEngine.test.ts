import { describe, expect, it } from "vitest";
import { activeDays, expandCosts, ruleAmount } from "./costEngine";
import type { CostActivity, CostRule } from "./money.types";

const rule = (overrides: Partial<CostRule> = {}): CostRule => ({
  id: "r1",
  name: "Regra",
  businessUnit: "BOTH",
  category: "OPERATIONAL",
  subcategory: "other",
  frequency: "MONTHLY",
  value: 3000,
  startDate: "2026-01-01",
  endDate: null,
  ...overrides,
});

const window = { inicio: "2026-08-01", fim: "2026-08-31" };

const activity: CostActivity = {
  ecommerce: { orders: 800, revenue: 200_000 },
  marketplace: { orders: 200, revenue: 50_000 },
  adSpend: 40_000,
};

describe("activeDays", () => {
  it("counts the overlap inclusively", () => {
    expect(activeDays(rule(), window)).toBe(31);
    expect(activeDays(rule({ startDate: "2026-08-15" }), window)).toBe(17);
    expect(activeDays(rule({ endDate: "2026-08-10" }), window)).toBe(10);
  });

  it("is zero when the rule is not active in the window", () => {
    expect(activeDays(rule({ startDate: "2026-09-01" }), window)).toBe(0);
    expect(activeDays(rule({ endDate: "2026-07-31" }), window)).toBe(0);
  });
});

describe("ruleAmount", () => {
  it("prorates recurring rules by active days", () => {
    expect(ruleAmount(rule({ frequency: "DAILY", value: 10 }), window, activity)).toBe(310);
    expect(ruleAmount(rule({ frequency: "WEEKLY", value: 70 }), window, activity)).toBe(310);
    expect(ruleAmount(rule({ frequency: "MONTHLY", value: 3000 }), window, activity)).toBeCloseTo(
      3055.4,
      0,
    );
    expect(ruleAmount(rule({ frequency: "YEARLY", value: 36_525 }), window, activity)).toBe(3100);
  });

  it("charges a one-time rule only in the window that contains its start", () => {
    expect(
      ruleAmount(
        rule({ frequency: "ONE_TIME", value: 900, startDate: "2026-08-20" }),
        window,
        activity,
      ),
    ).toBe(900);
    expect(
      ruleAmount(
        rule({ frequency: "ONE_TIME", value: 900, startDate: "2026-07-20" }),
        window,
        activity,
      ),
    ).toBe(0);
  });

  it("applies per-order and percentage rules to the matching business unit", () => {
    expect(
      ruleAmount(
        rule({ frequency: "PER_ORDER", value: 2, businessUnit: "ECOMMERCE" }),
        window,
        activity,
      ),
    ).toBe(1600);
    expect(
      ruleAmount(
        rule({ frequency: "PERCENT_PER_ORDER", value: 10, businessUnit: "MARKETPLACE" }),
        window,
        activity,
      ),
    ).toBe(5000);
    expect(
      ruleAmount(
        rule({ frequency: "PERCENT_PER_ORDER", value: 4, businessUnit: "BOTH" }),
        window,
        activity,
      ),
    ).toBe(10_000);
    expect(ruleAmount(rule({ frequency: "PERCENT_OF_AD_SPEND", value: 5 }), window, activity)).toBe(
      2000,
    );
  });
});

describe("expandCosts", () => {
  it("sums rules into the three DRE lines", () => {
    const totals = expandCosts(
      [
        rule({ category: "COGS", frequency: "PERCENT_PER_ORDER", value: 4 }),
        rule({ category: "SALES_MARKETING", frequency: "DAILY", value: 100 }),
        rule({ category: "OPERATIONAL", frequency: "DAILY", value: 50 }),
      ],
      window,
      activity,
    );
    expect(totals).toEqual({
      cogs: 10_000,
      salesMarketing: 3100,
      operational: 1550,
      total: 14_650,
    });
  });
});
