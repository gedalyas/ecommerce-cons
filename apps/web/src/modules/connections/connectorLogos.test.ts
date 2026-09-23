import { describe, expect, it } from "vitest";
import { connectorLogoPath, monogramOf } from "./connectorLogos";

describe("monogramOf", () => {
  it("takes the initials of the first two words, ignoring what is in parentheses", () => {
    expect(monogramOf("Mercado Livre")).toBe("ML");
    expect(monogramOf("Bling")).toBe("B");
    expect(monogramOf("Tiny (Olist)")).toBe("T");
    expect(monogramOf("Amazon Ads")).toBe("AA");
  });
});

describe("connectorLogoPath", () => {
  it("carries a drawable path for the brands of the open icon set", () => {
    for (const path of Object.values(connectorLogoPath)) expect(path).toMatch(/^M/);
    expect(connectorLogoPath.bling).toBeUndefined();
  });
});
