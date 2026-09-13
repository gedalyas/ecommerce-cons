import { describe, expect, it } from "vitest";
import { regionRows, totalOf } from "./regionPerformance";

const spend = [
  {
    province: "SP",
    platform: "META" as const,
    spend: 1000,
    impressions: 100_000,
    clicks: 2_000,
    conversions: 30,
  },
  {
    province: "SP",
    platform: "GOOGLE" as const,
    spend: 500,
    impressions: 20_000,
    clicks: 1_000,
    conversions: 10,
  },
  {
    province: "RJ",
    platform: "META" as const,
    spend: 400,
    impressions: 40_000,
    clicks: 800,
    conversions: 8,
  },
];
const sales = [
  {
    province: "SP",
    revenue: 6_000,
    orders: 24,
    customers: 22,
    repeat_orders: 4,
    new_customers: 18,
  },
  { province: "MG", revenue: 900, orders: 3, customers: 3, repeat_orders: 0, new_customers: 3 },
];

describe("regionRows", () => {
  it("joins spend and sales by UF and derives the ratios", () => {
    const rows = regionRows(spend, sales, false);
    const sp = rows.find((r) => r.province === "SP")!;
    expect(sp.metaSpend).toBe(1000);
    expect(sp.googleSpend).toBe(500);
    expect(sp.totalSpend).toBe(1500);
    expect(sp.roas).toBe(4);
    expect(sp.cpm).toBe(12.5);
    expect(sp.cpc).toBe(0.5);
    expect(sp.cpa).toBe(62.5);
    expect(sp.cac).toBeCloseTo(83.33, 2);
    expect(sp.averageTicket).toBe(250);
    expect(sp.repurchaseRate).toBeCloseTo(16.67, 2);
  });

  it("keeps a state that only has sales or only has spend", () => {
    const rows = regionRows(spend, sales, false);
    expect(rows.find((r) => r.province === "MG")?.roas).toBeNull();
    expect(rows.find((r) => r.province === "RJ")?.revenue).toBe(0);
  });

  it("adds the platform fee to the spend when asked", () => {
    const sp = regionRows(spend, sales, true).find((r) => r.province === "SP")!;
    expect(sp.totalSpend).toBeCloseTo(1522.5, 2);
  });
});

describe("totalOf", () => {
  it("sums the additive columns and recomputes the ratios", () => {
    const total = totalOf(regionRows(spend, sales, false));
    expect(total.province).toBe("Total");
    expect(total.totalSpend).toBe(1900);
    expect(total.revenue).toBe(6900);
    expect(total.roas).toBeCloseTo(3.63, 2);
  });
});
