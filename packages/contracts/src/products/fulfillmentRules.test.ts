import { describe, expect, it } from "vitest";
import { isMarketplaceStock } from "./fulfillmentRules";

describe("isMarketplaceStock", () => {
  it("is the marketplace's stock when at least half of the last 30 days went through Full / FBA", () => {
    expect(isMarketplaceStock(40, 30)).toBe(true);
    expect(isMarketplaceStock(40, 20)).toBe(true);
    expect(isMarketplaceStock(40, 19)).toBe(false);
  });

  it("is the store's stock when nothing sold in 30 days", () => {
    expect(isMarketplaceStock(0, 0)).toBe(false);
  });
});
