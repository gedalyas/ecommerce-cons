import { describe, expect, it } from "vitest";
import { computeDashboardMetrics, type DashboardFacts } from "./dashboardMetrics";

const facts: DashboardFacts = {
  revenue: 100_000,
  orders: 400,
  ecommerceOrders: 320,
  ecommerceRevenue: 80_000,
  cogs: 48_000,
  repeatOrders: 60,
  customers: 380,
  newCustomers: 300,
  sessions: 16_000,
  adSpend: 18_000,
  adPlatformFee: 300,
  siteAdInvestment: 16_000,
  costs: { cogs: 5_000, salesMarketing: 1_700, operational: 9_000, total: 15_700 },
};

describe("computeDashboardMetrics", () => {
  const m = computeDashboardMetrics(facts, "todos");

  it("derives sales metrics", () => {
    expect(m.totalSold).toBe(100_000);
    expect(m.orders).toBe(400);
    expect(m.averageTicket).toBe(250);
    expect(m.customers).toBe(380);
    expect(m.repurchaseRate).toBe(15);
  });

  it("counts investment as ad spend + platform fee + marketing cost rules, ROAS over the site's share", () => {
    expect(m.marketingInvestment).toBe(20_000);
    expect(m.cac).toBe(20);
    expect(m.cpa).toBe(50);
    expect(m.roi).toBe(4);
    expect(m.roas).toBe(5);
    expect(m.mer).toBe(5);
  });

  it("converts store orders over sessions", () => {
    expect(m.conversionRate).toBe(2);
  });

  it("builds contribution margin and net profit from the DRE lines", () => {
    expect(m.contributionMargin).toBe(27);
    expect(m.netProfit).toBe(18_000);
  });

  it("leaves paid-media metrics undefined for the marketplace channel", () => {
    const mp = computeDashboardMetrics(
      { ...facts, sessions: 0, adSpend: 0, adPlatformFee: 0 },
      "marketplace",
    );
    expect(mp.conversionRate).toBeNull();
    expect(mp.roi).toBeNull();
    expect(mp.roas).toBeNull();
    expect(mp.mer).toBeNull();
    expect(mp.cac).toBeNull();
    expect(mp.cpa).toBeNull();
    expect(mp.totalSold).toBe(100_000);
  });

  it("returns null instead of dividing by zero", () => {
    const empty = computeDashboardMetrics(
      {
        ...facts,
        revenue: 0,
        orders: 0,
        newCustomers: 0,
        sessions: 0,
        adSpend: 0,
        adPlatformFee: 0,
        costs: { cogs: 0, salesMarketing: 0, operational: 0, total: 0 },
      },
      "todos",
    );
    expect(empty.averageTicket).toBeNull();
    expect(empty.conversionRate).toBeNull();
    expect(empty.cac).toBeNull();
    expect(empty.contributionMargin).toBeNull();
  });
});
