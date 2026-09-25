import { describe, expect, it } from "vitest";
import {
  accountOptions,
  accountsToSync,
  adSpendRowOfMeta,
  campaignTypeOfObjective,
  metaInsightId,
  purchaseTotal,
} from "./metaAdsRows";

const context = { accountId: "act_1", thumbnails: new Map([["a1", "https://cdn/thumb.jpg"]]) };

describe("meta ads rows", () => {
  const insight = {
    date_start: "2026-09-03",
    account_name: "Loja · E-commerce",
    campaign_id: "c1",
    campaign_name: "Lançamento",
    objective: "OUTCOME_SALES",
    adset_id: "s1",
    adset_name: "Lookalike",
    ad_id: "a1",
    ad_name: "Vídeo manta",
    spend: "150.456",
    impressions: "1000",
    reach: "700",
    clicks: "60",
    actions: [
      { action_type: "link_click", value: "40" },
      { action_type: "landing_page_view", value: "32" },
      { action_type: "omni_add_to_cart", value: "9" },
      { action_type: "purchase", value: "3" },
      { action_type: "lead", value: "2" },
      { action_type: "onsite_conversion.messaging_conversation_started_7d", value: "5" },
    ],
    action_values: [{ action_type: "omni_purchase", value: "899.9" }],
  };

  it("maps an insight with the account, reach, actions, campaign type and thumbnail", () => {
    expect(adSpendRowOfMeta(insight, 0, context)).toEqual({
      row: 1,
      date: "2026-09-03",
      platform: "META",
      accountId: "act_1",
      accountName: "Loja · E-commerce",
      campaignId: "c1",
      campaignName: "Lançamento",
      campaignType: "CONVERSIONS",
      adsetId: "s1",
      adsetName: "Lookalike",
      adId: "a1",
      adName: "Vídeo manta",
      spend: 150.46,
      platformFee: 0,
      impressions: 1000,
      reach: 700,
      clicks: 60,
      linkClicks: 40,
      landingPageViews: 32,
      addToCart: 9,
      conversions: 3,
      leads: 2,
      messages: 5,
      attributedRevenue: 899.9,
      thumbnailUrl: "https://cdn/thumb.jpg",
    });
    expect(metaInsightId(insight, 0)).toBe("2026-09-03:a1");
  });

  it("drops rows without a date or campaign and tolerates missing actions", () => {
    expect(adSpendRowOfMeta({ campaign_id: "c1" }, 0, context)).toBeNull();
    expect(purchaseTotal(null)).toBe(0);
    const bare = adSpendRowOfMeta({ date_start: "2026-09-03", campaign_id: "c1" }, 2, context);
    expect(bare).toMatchObject({ adId: "c1", accountName: "act_1", campaignType: null, leads: 0 });
    expect(bare?.thumbnailUrl).toBeNull();
  });

  it("names the campaign type after its objective, keeping an unknown one as sent", () => {
    expect(campaignTypeOfObjective("OUTCOME_LEADS")).toBe("LEADS");
    expect(campaignTypeOfObjective("MESSAGES")).toBe("MESSAGES");
    expect(campaignTypeOfObjective("APP_INSTALLS")).toBe("APP_INSTALLS");
    expect(campaignTypeOfObjective(null)).toBeNull();
  });
});

describe("meta accounts", () => {
  const accounts = [
    { id: "act_1", label: "E-commerce" },
    { id: "act_2", label: "Lojas físicas" },
  ];

  it("offers every account at once when there is more than one", () => {
    expect(accountOptions(accounts)[0]).toEqual({ id: "all", label: "Todas as contas" });
    expect(accountOptions(accounts.slice(0, 1))).toEqual(accounts.slice(0, 1));
    const many = Array.from({ length: 11 }, (_, i) => ({ id: `act_${i}`, label: `Conta ${i}` }));
    expect(accountOptions(many)[0]?.id).toBe("act_0");
  });

  it("syncs the chosen account, every account, or none before a choice", () => {
    expect(accountsToSync("act_2", ["act_1", "act_2"])).toEqual(["act_2"]);
    expect(accountsToSync("all", ["act_1", "act_2"])).toEqual(["act_1", "act_2"]);
    expect(accountsToSync(null, ["act_1"])).toEqual([]);
    expect(accountsToSync("me/..", ["act_1"])).toEqual([]);
    const ids = Array.from({ length: 12 }, (_, i) => `act_${i}`);
    expect(accountsToSync("all", ids)).toHaveLength(10);
  });
});
