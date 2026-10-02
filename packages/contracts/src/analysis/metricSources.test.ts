import { describe, expect, it } from "vitest";
import { metricSourceNotice } from "./metricSources";

const none = { traffic: false, ad_spend: false };
const all = { traffic: true, ad_spend: true };

describe("metricSourceNotice", () => {
  it("warns when a traffic metric has no traffic source", () => {
    expect(metricSourceNotice("conversionRate", none)).toMatch(/fonte de tráfego/);
    expect(metricSourceNotice("conversionRate", { ...none, traffic: true })).toBeNull();
  });

  it("warns when a paid-media metric has no ad source", () => {
    expect(metricSourceNotice("roas", none)).toMatch(/fonte de anúncios/);
    expect(metricSourceNotice("cac", all)).toBeNull();
  });

  it("stays quiet for metrics that come from the orders", () => {
    expect(metricSourceNotice("totalSold", none)).toBeNull();
  });
});
