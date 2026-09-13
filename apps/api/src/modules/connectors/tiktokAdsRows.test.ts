import { describe, expect, it } from "vitest";
import { adSpendRowOfTiktok } from "./tiktokAdsRows";

describe("tiktok ads rows", () => {
  it("maps a report row", () => {
    expect(
      adSpendRowOfTiktok(
        {
          dimensions: { ad_id: "77", stat_time_day: "2026-09-03 00:00:00" },
          metrics: {
            campaign_id: "c9",
            campaign_name: "TikTok lançamento",
            adgroup_id: "g9",
            adgroup_name: "Grupo",
            ad_name: "Vídeo",
            spend: "80.5",
            impressions: "5000",
            clicks: "120",
            conversion: "5",
            total_purchase_value: "1500",
          },
        },
        0,
      ),
    ).toEqual({
      row: 1,
      date: "2026-09-03",
      platform: "TIKTOK",
      campaignId: "c9",
      campaignName: "TikTok lançamento",
      adsetId: "g9",
      adsetName: "Grupo",
      adId: "77",
      adName: "Vídeo",
      spend: 80.5,
      platformFee: 0,
      impressions: 5000,
      clicks: 120,
      conversions: 5,
      attributedRevenue: 1500,
    });
    expect(adSpendRowOfTiktok({ metrics: { campaign_id: "c" } }, 0)).toBeNull();
  });
});
