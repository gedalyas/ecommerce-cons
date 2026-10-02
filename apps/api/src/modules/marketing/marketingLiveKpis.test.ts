import { describe, expect, it } from "vitest";
import { metricValue } from "@ecommerce/contracts/shared/metricValue";
import type {
  MarketingOverview,
  MarketingRetention,
  MarketingSocial,
} from "@ecommerce/contracts/marketing";
import { liveKpiKeys } from "@ecommerce/contracts/consulting";
import { marketingLiveKpis } from "./marketingLiveKpis";

const count = (v: number | null) => metricValue("count", v, null);

const overview = {
  cac: metricValue("currency", 62, null),
  roas: metricValue("multiplier", 4.1, null),
  adSpend: metricValue("currency", 12000, null),
  topChannelShare: metricValue("percent", 55, null),
  topChannel: "google / cpc",
  conversionRate: metricValue("percent", 2.1, null),
  aov: metricValue("currency", 210, null),
  cartAbandonment: metricValue("percent", 70, null),
} as MarketingOverview;

const retention: MarketingRetention = { repurchaseRate90: 18, ltv12Months: 640 };

const social = {
  followers: count(18470),
  reach: count(120000),
  engagement: count(3600),
  posts: count(24),
  engagementRate: metricValue("percent", 3, null),
  accounts: [{ platform: "INSTAGRAM", accountId: "ig1" }],
} as MarketingSocial;

describe("marketingLiveKpis", () => {
  it("covers every marketing live key of the engagement template", () => {
    const kpis = marketingLiveKpis(overview, retention, social);
    const marketingKeys = liveKpiKeys.filter(
      (k) =>
        ![
          "contributionMarginRate",
          "cogsRate",
          "sellingCostRate",
          "shippingCostPerOrder",
          "stockOutRate",
          "coverageDays",
          "revenueConcentration",
        ].includes(k),
    );
    for (const key of marketingKeys) expect(kpis[key], key).toBeDefined();
  });

  it("feeds the presence pillar from the social metrics", () => {
    const kpis = marketingLiveKpis(overview, retention, social);
    expect(kpis.followers?.metric.value).toBe(18470);
    expect(kpis.socialReach?.metric.value).toBe(120000);
    expect(kpis.socialEngagementRate?.metric.value).toBe(3);
    expect(kpis.socialEngagementRate?.goodWhen).toBe("up");
  });

  it("shows the presence KPIs as empty, not zero, when no social account is connected", () => {
    const empty = {
      ...social,
      followers: count(0),
      reach: count(0),
      accounts: [],
    } as MarketingSocial;
    const kpis = marketingLiveKpis(overview, retention, empty);
    expect(kpis.followers?.metric).toEqual(metricValue("count", null, null));
    expect(kpis.socialReach?.metric.value).toBeNull();
    expect(kpis.socialEngagementRate?.metric.value).toBeNull();
  });
});
