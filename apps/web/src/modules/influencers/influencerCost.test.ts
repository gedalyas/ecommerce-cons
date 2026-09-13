import { describe, expect, it } from "vitest";
import { activeDays, influencerCost, roiOf, ruleCost, sumActivity } from "./influencerCost";
import type { InfluencerRule } from "@ecommerce/contracts/influencers";

const window = { inicio: "2026-08-01", fim: "2026-08-31" };
const activity = {
  orders: 40,
  revenue: 10_000,
  productRevenue: 9_000,
  shippingRevenue: 1_000,
  customers: 38,
  newCustomers: 30,
  repeatOrders: 6,
};

const rule = (over: Partial<InfluencerRule>): InfluencerRule => ({
  id: "r",
  type: "FIXED",
  value: 100,
  startDate: "2026-01-01",
  endDate: null,
  cap: null,
  notes: "",
  ...over,
});

describe("activeDays", () => {
  it("clips the rule to the window, inclusive", () => {
    expect(activeDays(rule({}), window)).toBe(31);
    expect(activeDays(rule({ startDate: "2026-08-20", endDate: "2026-09-05" }), window)).toBe(12);
    expect(activeDays(rule({ endDate: "2026-07-31" }), window)).toBe(0);
  });
});

describe("ruleCost", () => {
  it("applies each remuneration type", () => {
    expect(ruleCost(rule({ type: "FIXED", startDate: "2026-08-10" }), window, activity)).toBe(100);
    expect(ruleCost(rule({ type: "FIXED", startDate: "2026-07-10" }), window, activity)).toBe(0);
    expect(ruleCost(rule({ type: "DAILY", value: 10 }), window, activity)).toBe(310);
    expect(ruleCost(rule({ type: "WEEKLY", value: 70 }), window, activity)).toBe(310);
    expect(ruleCost(rule({ type: "MONTHLY", value: 1500 }), window, activity)).toBeCloseTo(
      1527.72,
      2,
    );
    expect(ruleCost(rule({ type: "PER_ORDER", value: 8 }), window, activity)).toBe(320);
    expect(ruleCost(rule({ type: "PERCENT_OF_PRODUCTS", value: 10 }), window, activity)).toBe(900);
    expect(ruleCost(rule({ type: "PERCENT_OF_TOTAL", value: 5 }), window, activity)).toBe(500);
  });

  it("respects the ceiling", () => {
    expect(ruleCost(rule({ type: "PER_ORDER", value: 8, cap: 200 }), window, activity)).toBe(200);
  });
});

describe("influencerCost, roiOf and sumActivity", () => {
  it("adds the rules and derives ROI", () => {
    const cost = influencerCost(
      [rule({ type: "MONTHLY", value: 1000 }), rule({ type: "PERCENT_OF_TOTAL", value: 10 })],
      window,
      activity,
    );
    expect(cost).toBeCloseTo(2018.48, 2);
    expect(roiOf(10_000, 2_000)).toBe(400);
    expect(roiOf(10_000, 0)).toBeNull();
    expect(sumActivity([activity, activity]).orders).toBe(80);
  });
});
