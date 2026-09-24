import { describe, expect, it } from "vitest";
import { cpaSeries, funnelTotals, stageSeries, type StageRow } from "./funnelSummary";

const row = (over: Partial<StageRow>): StageRow => ({
  bucket: "2026-09-01",
  platform: "META",
  stage: "TOP",
  channel: "site",
  spend: 100,
  platformFee: 0,
  conversions: 0,
  ...over,
});

const current = [
  row({ spend: 600 }),
  row({ stage: "BOTTOM", spend: 300, conversions: 6 }),
  row({ platform: "GOOGLE", stage: "BOTTOM", spend: 100, conversions: 4 }),
];

describe("funnelTotals", () => {
  it("splits the investment by stage and by platform inside the stage", () => {
    const totals = funnelTotals(current, [row({ spend: 500 })], false);
    expect(totals.total.value).toBe(1000);
    const bottom = totals.stages.find((s) => s.stage === "BOTTOM");
    expect(bottom?.share).toBe(40);
    expect(bottom?.byPlatform.find((p) => p.platform === "GOOGLE")?.share).toBe(25);
    const top = totals.stages.find((s) => s.stage === "TOP");
    expect(top?.spend.variation).toBe(20);
    expect(totals.stages.find((s) => s.stage === "UNTAGGED")?.share).toBe(0);
    expect(totals.platforms.find((p) => p.platform === "META")?.share).toBe(90);
  });

  it("has no share and no comparison for an empty store", () => {
    const totals = funnelTotals([], null, false);
    expect(totals.total).toMatchObject({ value: 0, previous: null });
    expect(totals.stages.every((s) => s.share == null)).toBe(true);
  });
});

describe("stageSeries", () => {
  it("puts each stage's investment in its bucket, fee included when asked", () => {
    const [point, empty] = stageSeries(
      ["2026-09-01", "2026-10-01"],
      [...current, row({ stage: "UNTAGGED", spend: 50, platformFee: 5 })],
      true,
    );
    expect(point).toEqual({ bucket: "2026-09-01", TOP: 600, MIDDLE: 0, BOTTOM: 400, UNTAGGED: 55 });
    expect(empty?.TOP).toBe(0);
  });
});

describe("cpaSeries", () => {
  it("divides the site's investment by ERP site orders and each platform by its conversions", () => {
    const [point] = cpaSeries(
      ["2026-09-01"],
      [...current, row({ channel: "Mercado Livre", spend: 200, conversions: 4 })],
      [{ bucket: "2026-09-01", orders: 20 }],
      false,
    );
    expect(point).toEqual({ bucket: "2026-09-01", site: 50, META: 110, GOOGLE: 25, TIKTOK: null });
  });
});
