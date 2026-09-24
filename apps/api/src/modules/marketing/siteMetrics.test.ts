import { describe, expect, it } from "vitest";
import {
  audienceRow,
  pageRow,
  regionRow,
  siteKpiUnit,
  siteKpiValues,
  siteSeries,
} from "./siteMetrics";

const sums = {
  sessions: 1000,
  engagedSessions: 620,
  users: 800,
  newUsers: 500,
  pageViews: 3200,
  durationSeconds: 95_000,
};

describe("siteKpiValues", () => {
  it("derives engagement, bounce and the average session", () => {
    const k = siteKpiValues(sums);
    expect(k.engagementRate).toBe(62);
    expect(k.bounceRate).toBe(38);
    expect(k.averageDuration).toBe(95);
    expect(k.newUsers).toBe(500);
    expect(siteKpiUnit.averageDuration).toBe("seconds");
  });

  it("leaves the ratios empty without sessions", () => {
    const k = siteKpiValues({ ...sums, sessions: 0, engagedSessions: 0 });
    expect(k.engagementRate).toBeNull();
    expect(k.bounceRate).toBeNull();
    expect(k.averageDuration).toBeNull();
  });
});

describe("siteSeries", () => {
  it("fills every bucket and keeps empty ratios as gaps", () => {
    const [point, empty] = siteSeries(
      ["2026-08-01", "2026-09-01"],
      [{ bucket: "2026-08-01", ...sums }],
    );
    expect(point?.engagementRate).toBe(62);
    expect(point?.newUserShare).toBe(62.5);
    expect(empty).toMatchObject({ sessions: 0, engagementRate: null, newUserShare: null });
  });
});

describe("rows", () => {
  it("derives the rates of an audience slice, a page and a region", () => {
    const audience = audienceRow({
      value: "female",
      label: "Feminino",
      sessions: 200,
      engagedSessions: 150,
      users: 180,
      purchases: 4,
    });
    expect(audience.engagementRate).toBe(75);
    expect(audience.purchaseRate).toBe(2);
    const page = pageRow({
      path: "/",
      pageViews: 900,
      sessions: 300,
      engagedSessions: 150,
      durationSeconds: 18_000,
    });
    expect(page.averageDuration).toBe(60);
    const region = regionRow({
      province: "SP",
      sessions: 0,
      pageViews: 0,
      engagedSessions: 0,
      purchases: 0,
    });
    expect(region.engagementRate).toBeNull();
  });
});
