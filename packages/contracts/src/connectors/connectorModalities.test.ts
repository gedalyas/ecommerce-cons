import { describe, expect, it } from "vitest";
import { familyOf, keepsOrderFor, sameFamily } from "./connectorModalities";

describe("connector modalities", () => {
  it("groups a marketplace's modalities under the platform", () => {
    expect(familyOf("mercado_livre_full")).toBe("mercado_livre");
    expect(familyOf("amazon_fba_classic")).toBe("amazon");
    expect(familyOf("bling")).toBe("bling");
    expect(sameFamily("amazon", "amazon_fba_onsite")).toBe(true);
    expect(sameFamily("mercado_livre", "amazon")).toBe(false);
  });

  it("keeps own-shipping orders (or unflagged ones) on the platform's card", () => {
    expect(keepsOrderFor("mercado_livre", "SELLER")).toBe(true);
    expect(keepsOrderFor("mercado_livre", null)).toBe(true);
    expect(keepsOrderFor("mercado_livre", "MARKETPLACE")).toBe(false);
  });

  it("keeps only fulfillment orders on the Full and FBA cards", () => {
    expect(keepsOrderFor("mercado_livre_full", "MARKETPLACE")).toBe(true);
    expect(keepsOrderFor("mercado_livre_full", "SELLER")).toBe(false);
    expect(keepsOrderFor("amazon_fba_classic", null)).toBe(false);
  });

  it("keeps everything for connectors without modalities", () => {
    expect(keepsOrderFor("bling", "MARKETPLACE")).toBe(true);
  });
});
