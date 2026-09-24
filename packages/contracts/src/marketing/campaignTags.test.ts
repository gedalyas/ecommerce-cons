import { describe, expect, it } from "vitest";
import { untaggedSummary } from "./campaignTags";
import type { CampaignTagRow } from "./marketing.types";

const tag = (spend: number, stage: CampaignTagRow["stage"]): CampaignTagRow => ({
  platform: "META",
  campaignId: `c${spend}`,
  campaignName: "Campanha",
  spend,
  stage,
  channel: "site",
});

describe("untaggedSummary", () => {
  it("counts the campaigns without a stage and their share of the investment", () => {
    expect(untaggedSummary([tag(300, "TOP"), tag(100, null)])).toEqual({
      count: 1,
      spendShare: 25,
    });
  });

  it("has no share when nothing was invested", () => {
    expect(untaggedSummary([])).toEqual({ count: 0, spendShare: null });
  });
});
