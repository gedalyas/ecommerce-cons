import { describe, expect, it } from "vitest";
import {
  deriveDepth,
  paidMediums,
  platformKpiUnit,
  platformKpiValues,
  platformSeries,
  sumDepth,
  trafficSourcesOf,
  type AdDepthSums,
} from "./adDepth";

const sums = (over: Partial<AdDepthSums> = {}): AdDepthSums => ({
  key: "c1",
  id: "c1",
  name: "Prospecção",
  campaignId: "c1",
  campaignName: null,
  adsetId: null,
  adsetName: null,
  campaignType: "CONVERSIONS",
  thumbnailUrl: null,
  spend: 1000,
  platformFee: 15,
  impressions: 100_000,
  eligibleImpressions: 0,
  reach: 60_000,
  clicks: 2000,
  linkClicks: 1500,
  landingPageViews: 1200,
  addToCart: 80,
  conversions: 20,
  leads: 0,
  messages: 0,
  ...over,
});

describe("deriveDepth", () => {
  it("derives the efficiency ratios from the sums", () => {
    const row = deriveDepth(sums(), null, false);
    expect(row.cpm).toBe(10);
    expect(row.ctr).toBe(2);
    expect(row.cpc).toBe(0.5);
    expect(row.costPerView).toBeCloseTo(0.83, 2);
    expect(row.costPerConversion).toBe(50);
    expect(row.costPerLead).toBeNull();
    expect(row.impressionShare).toBeNull();
    expect(row.spendVariation).toBeNull();
  });

  it("sums impression share as impressions over eligible impressions", () => {
    const row = deriveDepth(sums({ impressions: 5000, eligibleImpressions: 10_000 }), null, false);
    expect(row.impressionShare).toBe(50);
  });

  it("compares with the previous period and folds the fee when asked", () => {
    const row = deriveDepth(sums(), sums({ spend: 800, platformFee: 12, conversions: 20 }), true);
    expect(row.spend).toBe(1015);
    expect(row.spendVariation).toBeCloseTo(25, 2);
    expect(row.conversionsVariation).toBe(0);
  });
});

describe("sumDepth", () => {
  it("adds every counter of the rows", () => {
    const total = sumDepth([sums(), sums({ spend: 500, leads: 3 })], "total", "Total");
    expect(total.spend).toBe(1500);
    expect(total.leads).toBe(3);
    expect(total.reach).toBe(120_000);
  });
});

describe("platform traffic", () => {
  it("knows which sources and mediums bring each platform's paid visits", () => {
    expect(trafficSourcesOf("META")).toContain("instagram");
    expect(trafficSourcesOf("GOOGLE")).toEqual(["google"]);
    expect(paidMediums).toContain("paid-social");
    expect(paidMediums).not.toContain("organic");
  });
});

describe("platformSeries", () => {
  it("puts spend, platform conversions and sessions side by side", () => {
    const [point, empty] = platformSeries(
      ["2026-09-01", "2026-09-02"],
      [{ bucket: "2026-09-01", spend: 300, conversions: 6 }],
      [{ bucket: "2026-09-01", sessions: 1200 }],
    );
    expect(point).toEqual({
      bucket: "2026-09-01",
      spend: 300,
      conversions: 6,
      costPerConversion: 50,
      sessions: 1200,
      costPerSession: 0.25,
    });
    expect(empty?.costPerSession).toBeNull();
  });

  it("leaves sessions empty when they cannot be told apart for the scope", () => {
    const [point] = platformSeries(["2026-09-01"], [], null);
    expect(point?.sessions).toBeNull();
    expect(point?.costPerSession).toBeNull();
  });
});

describe("platformKpiValues", () => {
  it("lays the platform tiles out of the total row and the paid sessions", () => {
    const values = platformKpiValues(deriveDepth(sums(), null, false), 800);
    expect(values.spend).toBe(1000);
    expect(values.sessions).toBe(800);
    expect(values.costPerSession).toBe(1.25);
    expect(values.impressionShare).toBeNull();
    expect(platformKpiUnit.ctr).toBe("percent");
  });

  it("leaves the cost per session empty without paid sessions", () => {
    expect(platformKpiValues(deriveDepth(sums(), null, false), 0).costPerSession).toBeNull();
    expect(platformKpiValues(deriveDepth(sums(), null, false), null).sessions).toBeNull();
  });
});
