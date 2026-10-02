import { describe, expect, it } from "vitest";
import type { OrderSnapshot } from "./importUndo.types";
import {
  adSpendDayKey,
  adSpendScopes,
  isUndoEntity,
  parseAdSpendDayKey,
  scopeAccounts,
  parseTrafficKey,
  trafficKey,
  undoPlanOf,
} from "./undoPlan";

const order: OrderSnapshot = {
  customerId: "c1",
  placedAt: "2026-09-01T00:00:00.000Z",
  paidAt: null,
  salesPlatform: "ECOMMERCE",
  channel: "Loja",
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
  financialStatus: "PENDING",
  paymentGateway: "x",
  processingMethod: "PIX",
  productRevenue: 10,
  shippingRevenue: 0,
  totalDiscounts: 0,
  totalPrice: 10,
  discountCodes: [],
  country: "BR",
  province: "SP",
  city: "",
  orderNumberForCustomer: 1,
  itemsCount: 1,
  items: [],
};

describe("keys", () => {
  it("round-trip the ad spend day and the traffic row", () => {
    const whole = { platform: "META" as const, date: "2026-09-01", accountId: null };
    expect(parseAdSpendDayKey(adSpendDayKey(whole))).toEqual(whole);
    const account = { platform: "META" as const, date: "2026-09-01", accountId: "act_1|x" };
    expect(parseAdSpendDayKey(adSpendDayKey(account))).toEqual(account);
    expect(parseAdSpendDayKey("GOOGLE|2026-09-01").accountId).toBeNull();
    const traffic = { date: "2026-09-01", source: "google", medium: "cpc|brand" };
    expect(parseTrafficKey(trafficKey(traffic))).toEqual(traffic);
  });
  it("recognises the closed set of entities", () => {
    expect(isUndoEntity("ORDER")).toBe(true);
    expect(isUndoEntity("order")).toBe(false);
  });
});

describe("undoPlanOf", () => {
  it("splits created rows (delete) from replaced rows (restore)", () => {
    const plan = undoPlanOf([
      { entity: "ORDER", key: "#1", previous: null },
      { entity: "ORDER", key: "#2", previous: order },
      { entity: "CUSTOMER", key: "a@b.c", previous: null },
      { entity: "CUSTOMER", key: "d@e.f", previous: { name: "Antes" } },
      { entity: "PRODUCT", key: "p1", previous: null },
      { entity: "AD_SPEND_DAY", key: "META|2026-09-01", previous: null },
      {
        entity: "AD_SPEND_DAY",
        key: "GOOGLE|2026-09-02",
        previous: [
          {
            campaignId: "c",
            campaignName: "c",
            adsetId: "s",
            adsetName: "s",
            adId: "a",
            adName: "a",
            spend: 1,
            platformFee: 0,
            impressions: 1,
            clicks: 1,
            conversions: 0,
            attributedRevenue: 0,
          },
        ],
      },
      { entity: "TRAFFIC", key: "2026-09-01|google|cpc", previous: null },
    ]);
    expect(plan.ordersToDelete).toEqual(["#1"]);
    expect(plan.ordersToRestore).toEqual([{ number: "#2", snapshot: order }]);
    expect(plan.customersToDelete).toEqual(["a@b.c"]);
    expect(plan.customersToRename).toEqual([{ email: "d@e.f", name: "Antes" }]);
    expect(plan.productsToDelete).toEqual(["p1"]);
    expect(plan.adSpendDays).toEqual([
      { key: { platform: "META", date: "2026-09-01", accountId: null }, rows: [] },
      {
        key: { platform: "GOOGLE", date: "2026-09-02", accountId: null },
        rows: [expect.objectContaining({ spend: 1 })],
      },
    ]);
    expect(plan.traffic).toEqual([
      { key: { date: "2026-09-01", source: "google", medium: "cpc" }, previous: null },
    ]);
  });
});

describe("products spreadsheet undo", () => {
  it("restores the variants it changed and clears the costs it filled", () => {
    const snapshot = {
      price: 99,
      cost: null,
      stockQty: null,
      stockUpdatedAt: null,
    };
    const info = { name: "Manta", category: "Sem categoria" };
    const plan = undoPlanOf([
      { entity: "VARIANT", key: "v1", previous: snapshot },
      { entity: "PRODUCT_INFO", key: "p1", previous: info },
      { entity: "ITEM_COST", key: "v1", previous: ["i1", "i2"] },
      { entity: "ITEM_COST", key: "v2", previous: ["i3"] },
    ]);
    expect(plan.variantsToRestore).toEqual([{ variantId: "v1", snapshot }]);
    expect(plan.productsToRestore).toEqual([{ productId: "p1", snapshot: info }]);
    expect(plan.itemCostsToClear).toEqual(["i1", "i2", "i3"]);
  });
});

describe("adSpendScopes", () => {
  it("replaces a spreadsheet day whole and a connector day per account", () => {
    const scopes = adSpendScopes([
      { platform: "META", date: "2026-09-01" },
      { platform: "META", date: "2026-09-01", accountId: "act_1" },
      { platform: "META", date: "2026-09-01", accountId: "act_1" },
      { platform: "META", date: "2026-09-01", accountId: "act_2" },
    ]);
    expect(scopes).toEqual([
      { platform: "META", date: "2026-09-01", accountId: null },
      { platform: "META", date: "2026-09-01", accountId: "act_1" },
      { platform: "META", date: "2026-09-01", accountId: "act_2" },
    ]);
    expect(scopes.map(scopeAccounts)).toEqual([null, ["act_1", ""], ["act_2", ""]]);
  });
});
