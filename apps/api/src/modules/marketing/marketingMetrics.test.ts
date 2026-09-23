import { describe, expect, it } from "vitest";
import {
  bestAndWorstByCost,
  channelPerformance,
  deriveAdRow,
  discountValues,
  funnelTable,
  investmentBreakdown,
} from "./marketingMetrics";

const sums = {
  id: "c1",
  name: "Prospecção",
  platform: "META" as const,
  campaignName: null,
  adsetName: null,
  spend: 1000,
  platformFee: 100,
  orders: 20,
  impressions: 200_000,
  clicks: 4_000,
};

describe("deriveAdRow", () => {
  it("derives the media ratios from the sums", () => {
    const row = deriveAdRow(sums, false);
    expect(row.cpa).toBe(50);
    expect(row.cpm).toBe(5);
    expect(row.cpc).toBe(0.25);
    expect(row.ctr).toBe(2);
  });

  it("folds the platform fee into the spend when asked", () => {
    const row = deriveAdRow(sums, true);
    expect(row.spend).toBe(1100);
    expect(row.cpa).toBe(55);
  });

  it("is null-safe on empty rows", () => {
    const row = deriveAdRow(
      { ...sums, spend: 0, platformFee: 0, orders: 0, impressions: 0, clicks: 0 },
      true,
    );
    expect(row.cpa).toBeNull();
    expect(row.cpm).toBeNull();
  });
});

describe("channelPerformance", () => {
  it("splits shared costs by revenue and derives ROI, ROAS, CPA and conversion", () => {
    const rows = channelPerformance({
      ecommerce: { orders: 100, revenue: 30_000, sessions: 5_000 },
      marketplace: { orders: 50, revenue: 10_000 },
      media: 6_000,
      costLines: [
        { key: "agency", label: "Agência", businessUnit: "ECOMMERCE", amount: 1_000 },
        { key: "fee", label: "Taxa", businessUnit: "MARKETPLACE", amount: 500 },
        { key: "shared", label: "Comissão", businessUnit: "BOTH", amount: 400 },
      ],
    });
    const [ecommerce, marketplace, total] = rows;
    expect(ecommerce!.investment).toBe(7_300);
    expect(marketplace!.investment).toBe(600);
    expect(total!.investment).toBe(7_900);
    expect(ecommerce!.conversionRate).toBe(2);
    expect(marketplace!.conversionRate).toBeNull();
    expect(ecommerce!.roas).toBeCloseTo(4.11, 2);
    expect(ecommerce!.roi).toBeCloseTo(310.96, 2);
    expect(total!.cpa).toBeCloseTo(52.67, 2);
  });
});

describe("investmentBreakdown", () => {
  it("orders the slices by value and adds the fee slice on demand", () => {
    const slices = investmentBreakdown(
      [
        { key: "META", label: "Meta Ads", spend: 700, platformFee: 70 },
        { key: "GOOGLE", label: "Google Ads", spend: 300, platformFee: 30 },
      ],
      true,
      [{ key: "agency", label: "Agência", businessUnit: "ECOMMERCE", amount: 200 }],
    );
    expect(slices.map((s) => s.key)).toEqual(["META", "GOOGLE", "agency", "platformFee"]);
    expect(slices[0]!.share).toBeCloseTo(53.85, 2);
  });
});

describe("funnelTable", () => {
  it("compares the period with the store average and the benchmark", () => {
    const counts = {
      sessions: 1000,
      viewItem: 200,
      addToCart: 80,
      checkout: 30,
      orders: 15,
      paidOrders: 12,
    };
    const table = funnelTable(counts, { ...counts, sessions: 2000 });
    expect(table.steps[0]).toEqual({ key: "sessions", label: "Sessões", value: 1000 });
    const first = table.ratios[0]!;
    expect(first.value).toBe(20);
    expect(first.average).toBe(10);
    expect(first.verdict).toBe("dentro");
  });
});

describe("discountValues", () => {
  it("derives the coupon KPIs", () => {
    const v = discountValues({
      orders: 100,
      revenue: 25_000,
      couponOrders: 20,
      couponRevenue: 4_000,
      discounts: 1_000,
    });
    expect(v.couponShare).toBe(20);
    expect(v.discountRate).toBe(20);
    expect(v.aovWithCoupon).toBe(200);
    expect(v.aovWithoutCoupon).toBe(262.5);
  });
});

describe("bestAndWorstByCost", () => {
  const row = (id: string, spend: number, orders: number) =>
    deriveAdRow({ ...sums, id, spend, orders }, false);

  it("ranks the cheapest conversions best and the biggest spend without conversions worst", () => {
    const { best, worst } = bestAndWorstByCost([
      row("cheap", 400, 20),
      row("mid", 1000, 20),
      row("dear", 2000, 20),
      row("pricey", 3000, 20),
      row("waste-small", 100, 0),
      row("waste-big", 5000, 0),
    ]);
    expect(best.map((r) => r.id)).toEqual(["cheap", "mid", "dear"]);
    expect(worst.map((r) => r.id)).toEqual(["waste-big", "waste-small", "pricey"]);
  });

  it("never lists a campaign without conversions as best", () => {
    const { best, worst } = bestAndWorstByCost([row("a", 300, 0), row("b", 900, 0)]);
    expect(best).toEqual([]);
    expect(worst.map((r) => r.id)).toEqual(["b", "a"]);
  });

  it("does not repeat a best campaign among the worst", () => {
    const { best, worst } = bestAndWorstByCost([row("x", 100, 10), row("y", 900, 10)]);
    expect(best.map((r) => r.id)).toEqual(["x", "y"]);
    expect(worst).toEqual([]);
  });
});
