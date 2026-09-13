import { describe, expect, it } from "vitest";
import { computeDre, computeDreIndicators, type DreFacts } from "./dre";

const facts: DreFacts = {
  revenue: 100_000,
  productRevenue: 102_000,
  discounts: 6_000,
  shipping: 4_000,
  orders: 400,
  cogs: 48_000,
  adSpend: 18_000,
  adPlatformFee: 300,
  costs: { cogs: 7_000, salesMarketing: 1_700, operational: 9_000, total: 17_700 },
};

describe("computeDre", () => {
  const lines = computeDre(facts);

  it("splits revenue into products net of discounts and shipping", () => {
    expect(lines.revenue).toBe(100_000);
    expect(lines.productRevenue).toBe(96_000);
    expect(lines.shippingRevenue).toBe(4_000);
  });

  it("walks down to net profit", () => {
    expect(lines.totalCosts).toBe(55_000);
    expect(lines.grossProfit).toBe(45_000);
    expect(lines.marketingExpenses).toBe(20_000);
    expect(lines.contributionMargin).toBe(25_000);
    expect(lines.operatingExpenses).toBe(9_000);
    expect(lines.netProfit).toBe(16_000);
  });
});

describe("computeDreIndicators", () => {
  it("expresses the lines as rates of revenue", () => {
    const i = computeDreIndicators(facts, computeDre(facts), 7_360);
    expect(i.grossMargin).toBe(45);
    expect(i.contributionMarginRate).toBe(25);
    expect(i.netMargin).toBe(16);
    expect(i.cogsRate).toBe(48);
    expect(i.sellingCostRate).toBeCloseTo(7);
    expect(i.marketingRate).toBe(20);
    expect(i.shippingCostPerOrder).toBe(18.4);
  });

  it("returns null rates without revenue or orders", () => {
    const empty = { ...facts, revenue: 0, orders: 0 };
    const i = computeDreIndicators(empty, computeDre(empty), 0);
    expect(i.grossMargin).toBeNull();
    expect(i.shippingCostPerOrder).toBeNull();
  });
});
