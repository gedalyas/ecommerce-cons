import { describe, expect, it } from "vitest";
import {
  benchmarkVerdict,
  channelOf,
  funnelRatio,
  funnelRatios,
  roasQuality,
  cacPercent,
} from "./marketingRules";

describe("roasQuality", () => {
  it("splits at 2 and 5", () => {
    expect(roasQuality(1.9)).toBe("baixo");
    expect(roasQuality(2)).toBe("medio");
    expect(roasQuality(5)).toBe("medio");
    expect(roasQuality(5.1)).toBe("alto");
    expect(roasQuality(null)).toBe("baixo");
  });
});

describe("funnelRatio", () => {
  const counts = {
    sessions: 10_000,
    viewItem: 3_000,
    addToCart: 1_200,
    checkout: 300,
    orders: 150,
    paidOrders: 130,
  };

  it("divides the target step by the source step, in percent", () => {
    const byKey = Object.fromEntries(funnelRatios.map((r) => [r.key, funnelRatio(counts, r)]));
    expect(byKey["sessionsToView"]).toBe(30);
    expect(byKey["viewToCart"]).toBe(40);
    expect(byKey["sessionsToPaid"]).toBe(1.3);
    expect(byKey["ordersToPaid"]).toBeCloseTo(86.67, 2);
  });

  it("is null when the source step is empty", () => {
    expect(funnelRatio({ ...counts, sessions: 0 }, funnelRatios[0]!)).toBeNull();
  });
});

describe("benchmarkVerdict", () => {
  it("compares with the market range", () => {
    expect(benchmarkVerdict(10, { min: 15, max: 40 })).toBe("abaixo");
    expect(benchmarkVerdict(20, { min: 15, max: 40 })).toBe("dentro");
    expect(benchmarkVerdict(50, { min: 15, max: 40 })).toBe("acima");
    expect(benchmarkVerdict(null, { min: 15, max: 40 })).toBeNull();
  });
});

describe("channelOf", () => {
  it("buckets the UTM medium", () => {
    expect(channelOf("cpc", false)).toBe("Mídia paga");
    expect(channelOf("organic", false)).toBe("Orgânico");
    expect(channelOf(null, false)).toBe("Direto");
    expect(channelOf("cpc", true)).toBe("Marketplace");
  });
});

describe("cacPercent", () => {
  it("is the share of revenue spent on marketing", () => {
    expect(cacPercent(20_000, 100_000)).toBe(20);
  });

  it("is null without revenue", () => {
    expect(cacPercent(5_000, 0)).toBeNull();
  });
});
