import { describe, expect, it } from "vitest";
import { areasOfConnector, canManageConnector } from "./connectorAccess";

describe("areasOfConnector", () => {
  it("maps the store data to Dados and the marketing kinds to Marketing, without repeats", () => {
    expect(areasOfConnector({ provides: ["products", "stock", "customers"] })).toEqual(["DATA"]);
    expect(areasOfConnector({ provides: ["sales"] })).toEqual(["DATA"]);
    expect(areasOfConnector({ provides: ["ad_spend", "traffic", "social"] })).toEqual([
      "MARKETING",
    ]);
    expect(areasOfConnector({ provides: ["sales", "ad_spend", "traffic"] })).toEqual([
      "DATA",
      "MARKETING",
    ]);
  });
});

describe("canManageConnector", () => {
  const marketingEditor = [{ area: "MARKETING", level: "edit" }] as const;

  it("lets a marketing editor manage paid media but not the storefront", () => {
    expect(canManageConnector(marketingEditor, { provides: ["ad_spend"] })).toBe(true);
    expect(canManageConnector(marketingEditor, { provides: ["sales"] })).toBe(false);
  });

  it("needs edit on every area the connector feeds", () => {
    expect(canManageConnector(marketingEditor, { provides: ["sales", "traffic"] })).toBe(false);
    expect(canManageConnector(null, { provides: ["sales", "traffic"] })).toBe(true);
  });
});
