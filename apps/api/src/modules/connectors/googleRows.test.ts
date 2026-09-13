import { describe, expect, it } from "vitest";
import { funnelRequest, reportCells, sessionsRequest, trafficRowsOf } from "./ga4Rows";
import { adSpendRowOfGoogle, adsQuery, customerIdOf } from "./googleAdsRows";

describe("google ads rows", () => {
  it("maps a searchStream row to an ad spend row in reais", () => {
    expect(
      adSpendRowOfGoogle(
        {
          segments: { date: "2026-09-03" },
          campaign: { id: "1", name: "Manta" },
          adGroup: { id: "10", name: "Grupo A" },
          adGroupAd: { ad: { id: "100", name: "Vídeo" } },
          metrics: {
            costMicros: "1234560000",
            impressions: "1000",
            clicks: "40",
            conversions: "3.0",
            conversionsValue: "900.5",
          },
        },
        0,
      ),
    ).toEqual({
      row: 1,
      date: "2026-09-03",
      platform: "GOOGLE",
      campaignId: "1",
      campaignName: "Manta",
      adsetId: "10",
      adsetName: "Grupo A",
      adId: "100",
      adName: "Vídeo",
      spend: 1234.56,
      platformFee: 0,
      impressions: 1000,
      clicks: 40,
      conversions: 3,
      attributedRevenue: 900.5,
    });
  });
  it("drops rows without a date or campaign and builds the query", () => {
    expect(adSpendRowOfGoogle({ campaign: { id: "1" } }, 0)).toBeNull();
    expect(adsQuery("2026-09-01", "2026-09-30")).toContain(
      "WHERE segments.date BETWEEN '2026-09-01' AND '2026-09-30'",
    );
    expect(customerIdOf("customers/123-456-7890")).toBe("1234567890");
  });
});

describe("ga4 rows", () => {
  const sessions = {
    dimensionHeaders: [{ name: "date" }, { name: "sessionSource" }, { name: "sessionMedium" }],
    metricHeaders: [{ name: "sessions" }, { name: "totalUsers" }, { name: "newUsers" }],
    rows: [
      {
        dimensionValues: [{ value: "20260903" }, { value: "google" }, { value: "cpc" }],
        metricValues: [{ value: "420" }, { value: "380" }, { value: "100" }],
      },
      {
        dimensionValues: [{ value: "20260903" }, { value: "" }, { value: "" }],
        metricValues: [{ value: "10" }, { value: "9" }, { value: "1" }],
      },
    ],
  };
  const funnel = {
    dimensionHeaders: [
      { name: "date" },
      { name: "sessionSource" },
      { name: "sessionMedium" },
      { name: "eventName" },
    ],
    metricHeaders: [{ name: "eventCount" }],
    rows: [
      {
        dimensionValues: [
          { value: "20260903" },
          { value: "google" },
          { value: "cpc" },
          { value: "add_to_cart" },
        ],
        metricValues: [{ value: "40" }],
      },
    ],
  };
  it("pivots the funnel events onto the session rows", () => {
    expect(trafficRowsOf(sessions, funnel)).toEqual([
      {
        row: 1,
        date: "2026-09-03",
        source: "google",
        medium: "cpc",
        sessions: 420,
        users: 380,
        newUsers: 100,
        viewItem: 0,
        addToCart: 40,
        beginCheckout: 0,
      },
      {
        row: 2,
        date: "2026-09-03",
        source: "(direct)",
        medium: "(none)",
        sessions: 10,
        users: 9,
        newUsers: 1,
        viewItem: 0,
        addToCart: 0,
        beginCheckout: 0,
      },
    ]);
  });
  it("reads cells by header name and builds the two requests", () => {
    expect(reportCells(sessions)[0]).toMatchObject({ sessionSource: "google", sessions: "420" });
    expect(sessionsRequest("2026-09-01", "2026-09-30").dimensions).toHaveLength(3);
    expect(
      funnelRequest("2026-09-01", "2026-09-30").dimensionFilter.filter.inListFilter.values,
    ).toEqual(["view_item", "add_to_cart", "begin_checkout"]);
  });
});
