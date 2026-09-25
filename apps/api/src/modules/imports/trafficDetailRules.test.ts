import { describe, expect, it } from "vitest";
import {
  daysOf,
  mergeKeywords,
  mergeTrafficDetail,
  normalizePagePath,
  trafficDetailSince,
} from "./trafficDetailRules";

describe("normalizePagePath", () => {
  it("drops the query string, the fragment and the trailing slash", () => {
    expect(normalizePagePath("/products/vaso?utm_source=meta#topo")).toBe("/products/vaso");
    expect(normalizePagePath("/collections/cama/")).toBe("/collections/cama");
    expect(normalizePagePath("/")).toBe("/");
    expect(normalizePagePath("cart")).toBe("/cart");
    expect(normalizePagePath(`/${"a".repeat(400)}`)).toHaveLength(300);
  });
});

describe("mergeTrafficDetail", () => {
  it("adds up rows that fall on the same key after normalising", () => {
    const detail = mergeTrafficDetail({
      pages: [
        {
          date: "2026-09-01",
          pagePath: "/cart?x=1",
          pageViews: 3,
          sessions: 2,
          engagedSessions: 1,
          durationSeconds: 30,
        },
        {
          date: "2026-09-01",
          pagePath: "/cart",
          pageViews: 2,
          sessions: 1,
          engagedSessions: 1,
          durationSeconds: 10,
        },
      ],
      items: [
        {
          date: "2026-09-01",
          itemId: " SKU-1 ",
          itemName: "Vaso",
          itemsViewed: 5,
          itemsAddedToCart: 1,
          itemsPurchased: 0,
        },
        {
          date: "2026-09-01",
          itemId: "SKU-1",
          itemName: "Vaso",
          itemsViewed: 5,
          itemsAddedToCart: 1,
          itemsPurchased: 1,
        },
        {
          date: "2026-09-01",
          itemId: "",
          itemName: "(not set)",
          itemsViewed: 9,
          itemsAddedToCart: 0,
          itemsPurchased: 0,
        },
      ],
      audience: [],
      regions: [],
    });
    expect(detail.pages).toEqual([
      {
        date: "2026-09-01",
        pagePath: "/cart",
        pageViews: 5,
        sessions: 3,
        engagedSessions: 2,
        durationSeconds: 40,
      },
    ]);
    expect(detail.items).toEqual([
      {
        date: "2026-09-01",
        itemId: "SKU-1",
        itemName: "Vaso",
        itemsViewed: 10,
        itemsAddedToCart: 2,
        itemsPurchased: 1,
      },
    ]);
  });
});

describe("mergeKeywords", () => {
  it("keys a keyword by ad group and match type", () => {
    const base = {
      date: "2026-09-01",
      platform: "GOOGLE" as const,
      accountId: "123",
      campaignId: "c",
      campaignName: "Search",
      adGroupId: "g",
      adGroupName: "Grupo",
      keyword: "loja exemplo",
      spend: 10,
      impressions: 100,
      clicks: 5,
      conversions: 1,
    };
    const rows = mergeKeywords([
      { ...base, matchType: "EXACT" },
      { ...base, matchType: "EXACT" },
      { ...base, matchType: "PHRASE" },
    ]);
    expect(rows.map((r) => [r.matchType, r.spend])).toEqual([
      ["EXACT", 20],
      ["PHRASE", 10],
    ]);
  });
});

describe("daysOf", () => {
  it("lists each day once", () => {
    expect(
      daysOf([{ date: "2026-09-01" }, { date: "2026-09-01" }, { date: "2026-09-02" }]),
    ).toEqual(["2026-09-01", "2026-09-02"]);
  });
});

describe("trafficDetailSince", () => {
  it("keeps only the days from the source cut on", () => {
    const region = (date: string) => ({
      date,
      province: "SP",
      sessions: 1,
      pageViews: 1,
      engagedSessions: 1,
      purchases: 0,
    });
    const cut = trafficDetailSince(
      { pages: [], items: [], audience: [], regions: [region("2026-08-31"), region("2026-09-01")] },
      "2026-09-01",
    );
    expect(cut.regions.map((r) => r.date)).toEqual(["2026-09-01"]);
  });
});
