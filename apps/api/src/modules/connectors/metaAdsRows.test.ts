import { describe, expect, it } from "vitest";
import { adSpendRowOfMeta, metaInsightId, purchaseTotal } from "./metaAdsRows";

describe("meta ads rows", () => {
  const insight = {
    date_start: "2026-09-03",
    date_stop: "2026-09-03",
    campaign_id: "c1",
    campaign_name: "Lançamento",
    adset_id: "s1",
    adset_name: "Lookalike",
    ad_id: "a1",
    ad_name: "Vídeo manta",
    spend: "150.456",
    impressions: "1000",
    clicks: "40",
    actions: [
      { action_type: "link_click", value: "40" },
      { action_type: "purchase", value: "3" },
    ],
    action_values: [{ action_type: "omni_purchase", value: "899.9" }],
  };
  it("maps an insight row with purchase conversions and revenue", () => {
    expect(adSpendRowOfMeta(insight, 0)).toEqual({
      row: 1,
      date: "2026-09-03",
      platform: "META",
      campaignId: "c1",
      campaignName: "Lançamento",
      adsetId: "s1",
      adsetName: "Lookalike",
      adId: "a1",
      adName: "Vídeo manta",
      spend: 150.46,
      platformFee: 0,
      impressions: 1000,
      clicks: 40,
      conversions: 3,
      attributedRevenue: 899.9,
    });
    expect(metaInsightId(insight, 0)).toBe("2026-09-03:a1");
  });
  it("drops rows without a date or campaign and tolerates missing actions", () => {
    expect(adSpendRowOfMeta({ campaign_id: "c1" }, 0)).toBeNull();
    expect(purchaseTotal(null)).toBe(0);
    expect(adSpendRowOfMeta({ date_start: "2026-09-03", campaign_id: "c1" }, 2)?.adId).toBe("c1");
  });
});
