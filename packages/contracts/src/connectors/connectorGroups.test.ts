import { describe, expect, it } from "vitest";
import {
  connectorCatalog,
  connectorGroups,
  connectorKindGuide,
  providesKind,
} from "./connectorCatalog";

describe("connectorGroups", () => {
  it("groups the catalog by kind with the ERP first and drops empty groups", () => {
    const groups = connectorGroups(connectorCatalog);
    expect(groups.map((g) => g.kind)).toEqual([
      "erp",
      "storefront",
      "marketplace",
      "paid_media",
      "social",
      "analytics",
      "manual",
    ]);
    expect(groups.map((g) => g.items.length).reduce((a, b) => a + b, 0)).toBe(
      connectorCatalog.length,
    );
    expect(connectorGroups([{ kind: "erp" }, { kind: "storefront" }]).map((g) => g.kind)).toEqual([
      "erp",
      "storefront",
    ]);
  });

  it("gives every kind a step and a hint", () => {
    const orders = Object.values(connectorKindGuide).map((g) => g.order);
    expect(new Set(orders).size).toBe(orders.length);
    for (const guide of Object.values(connectorKindGuide))
      expect(guide.hint.length).toBeGreaterThan(10);
  });
});

describe("providesKind", () => {
  it("lets only the ERP and the spreadsheet provide sales", () => {
    const salesSources = connectorCatalog
      .filter((c) => providesKind(c.key, "sales"))
      .map((c) => c.key);
    expect(salesSources.sort()).toEqual(["bling", "manual_csv"]);
  });

  it("keeps ad platforms to investment and storefronts to store data", () => {
    expect(providesKind("meta_ads", "ad_spend")).toBe(true);
    expect(providesKind("google_ads", "sales")).toBe(false);
    expect(providesKind("shopify", "products")).toBe(true);
    expect(providesKind("shopify", "sales")).toBe(false);
  });
});
