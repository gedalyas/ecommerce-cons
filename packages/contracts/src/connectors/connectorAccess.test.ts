import { describe, expect, it } from "vitest";
import { areasOfConnector, canManageConnector } from "./connectorAccess";

describe("areasOfConnector", () => {
  it("maps orders to Dados and the marketing feeds to Marketing, without repeats", () => {
    expect(areasOfConnector({ feeds: ["orders"] })).toEqual(["DATA"]);
    expect(areasOfConnector({ feeds: ["ad_spend", "traffic", "social"] })).toEqual(["MARKETING"]);
    expect(areasOfConnector({ feeds: ["orders", "ad_spend", "traffic"] })).toEqual([
      "DATA",
      "MARKETING",
    ]);
  });
});

describe("canManageConnector", () => {
  const marketingEditor = [{ area: "MARKETING", level: "edit" }] as const;

  it("lets a marketing editor manage paid media but not the storefront", () => {
    expect(canManageConnector(marketingEditor, { feeds: ["ad_spend"] })).toBe(true);
    expect(canManageConnector(marketingEditor, { feeds: ["orders"] })).toBe(false);
  });

  it("needs edit on every area the connector feeds", () => {
    expect(canManageConnector(marketingEditor, { feeds: ["orders", "traffic"] })).toBe(false);
    expect(canManageConnector(null, { feeds: ["orders", "traffic"] })).toBe(true);
  });
});
