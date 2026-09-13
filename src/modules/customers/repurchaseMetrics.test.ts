import { describe, expect, it } from "vitest";
import { computeLtvCac, computeRepurchase, retentionByOrderNumber } from "./repurchaseMetrics";

describe("computeRepurchase", () => {
  const v = computeRepurchase({
    revenue: 100_000,
    repeatRevenue: 18_000,
    orders: 400,
    repeatOrders: 60,
    customers: 380,
    repeatCustomers: 50,
    lifetimeFrequency: 1.3,
  });

  it("expresses repeat business as rates of the totals", () => {
    expect(v.repeatRevenueRate).toBe(18);
    expect(v.repeatOrderRate).toBe(15);
    expect(v.repeatCustomerRate).toBeCloseTo(13.16, 2);
    expect(v.frequency).toBe(1.3);
  });

  it("returns null rates on an empty window", () => {
    const empty = computeRepurchase({
      revenue: 0,
      repeatRevenue: 0,
      orders: 0,
      repeatOrders: 0,
      customers: 0,
      repeatCustomers: 0,
      lifetimeFrequency: null,
    });
    expect(empty.repeatOrderRate).toBeNull();
    expect(empty.frequency).toBeNull();
  });
});

describe("computeLtvCac", () => {
  it("builds LTV from ticket × frequency and CAC from investment ÷ new customers", () => {
    const v = computeLtvCac({
      revenue: 100_000,
      orders: 400,
      newCustomers: 300,
      marketingInvestment: 20_000,
      lifetimeFrequency: 1.5,
    });
    expect(v.averageTicket).toBe(250);
    expect(v.ltv).toBe(375);
    expect(v.cac).toBeCloseTo(66.67, 2);
    expect(v.cpa).toBe(50);
    expect(v.ltvCacRatio).toBeCloseTo(5.625, 3);
  });

  it("is null without new customers or orders", () => {
    const v = computeLtvCac({
      revenue: 0,
      orders: 0,
      newCustomers: 0,
      marketingInvestment: 500,
      lifetimeFrequency: 1,
    });
    expect(v.ltv).toBeNull();
    expect(v.cac).toBeNull();
    expect(v.ltvCacRatio).toBeNull();
  });
});

describe("retentionByOrderNumber", () => {
  it("chains the share of customers who reach the next order", () => {
    const rows = retentionByOrderNumber([
      { orders: 1, customers: 800 },
      { orders: 2, customers: 150 },
      { orders: 3, customers: 50 },
    ]);
    expect(rows[0]).toEqual({ orderNumber: 1, customers: 1000, rate: 20 });
    expect(rows[1]).toEqual({ orderNumber: 2, customers: 200, rate: 25 });
    expect(rows[2]).toEqual({ orderNumber: 3, customers: 50, rate: 0 });
    expect(rows[5]!.rate).toBeNull();
  });
});
