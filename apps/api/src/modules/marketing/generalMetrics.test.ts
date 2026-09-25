import { describe, expect, it } from "vitest";
import type { OrdersBucket } from "@ecommerce/contracts/orders";
import {
  funnelWithDelta,
  investedOf,
  lastMonthsWindow,
  monthEndProjection,
  salesInvestmentPoints,
  trafficPoints,
} from "./generalMetrics";

const orders = (bucket: string, revenue: number, siteRevenue: number, siteOrders: number) =>
  ({
    bucket,
    revenue,
    orders: 0,
    captured: 0,
    capturedOrders: 0,
    cogs: 0,
    repeatOrders: 0,
    productRevenue: 0,
    items: 0,
    discounts: 0,
    shipping: 0,
    ecommerce: { orders: siteOrders, revenue: siteRevenue },
    marketplace: { orders: 0, revenue: revenue - siteRevenue },
  }) satisfies OrdersBucket;

const ads = (bucket: string, spend: number) => ({
  bucket,
  spend,
  platformFee: spend * 0.015,
  impressions: 0,
  clicks: 0,
});

describe("investedOf", () => {
  it("adds the platform fee only when asked", () => {
    expect(investedOf({ spend: 1000, platformFee: 15 }, true)).toBe(1015);
    expect(investedOf({ spend: 1000, platformFee: 15 }, false)).toBe(1000);
    expect(investedOf(null, true)).toBe(0);
  });
});

describe("salesInvestmentPoints", () => {
  it("puts sold, invested and the site ROAS (over the site-tagged investment) side by side", () => {
    const points = salesInvestmentPoints(
      ["2026-08-01", "2026-09-01"],
      [orders("2026-08-01", 50_000, 40_000, 100)],
      [ads("2026-08-01", 10_000)],
      [{ bucket: "2026-08-01", investment: 8_000 }],
      false,
    );
    expect(points).toEqual([
      { bucket: "2026-08-01", sold: 50_000, invested: 10_000, roas: 5 },
      { bucket: "2026-09-01", sold: 0, invested: 0, roas: null },
    ]);
  });
});

describe("trafficPoints", () => {
  it("converts the site orders over the sessions of the bucket", () => {
    const [point] = trafficPoints(
      ["2026-09-01"],
      [
        {
          bucket: "2026-09-01",
          sessions: 2000,
          users: 1500,
          newUsers: 900,
          viewItem: 0,
          addToCart: 0,
          beginCheckout: 0,
        },
      ],
      [orders("2026-09-01", 0, 0, 30)],
    );
    expect(point).toEqual({
      bucket: "2026-09-01",
      sessions: 2000,
      newUsers: 900,
      conversionRate: 1.5,
    });
  });
});

describe("monthEndProjection", () => {
  it("extends the month-to-date pace to the end of the month", () => {
    expect(monthEndProjection(30_000, "2026-09-10")).toBe(90_000);
    expect(monthEndProjection(31_000, "2026-08-31")).toBe(31_000);
  });

  it("answers null for a malformed day", () => {
    expect(monthEndProjection(1, "")).toBeNull();
  });
});

describe("funnelWithDelta", () => {
  it("gives each step its value, the previous period and the pass-through from the step above", () => {
    const current = {
      sessions: 1000,
      viewItem: 500,
      addToCart: 50,
      checkout: 40,
      orders: 20,
      paidOrders: 18,
    };
    const steps = funnelWithDelta(current, { ...current, sessions: 800 });
    expect(steps[0]).toMatchObject({
      key: "sessions",
      value: 1000,
      previous: 800,
      fromPrevious: null,
    });
    expect(steps[1]).toMatchObject({ key: "viewItem", fromPrevious: 50 });
    expect(funnelWithDelta(current, null)[2]?.previous).toBeNull();
  });
});

describe("lastMonthsWindow", () => {
  it("covers the whole current month and the months before it", () => {
    const w = lastMonthsWindow("2026-09-10", 12);
    expect(w.start.toISOString().slice(0, 10)).toBe("2025-10-01");
    expect(w.end.toISOString().slice(0, 10)).toBe("2026-10-01");
  });
});
