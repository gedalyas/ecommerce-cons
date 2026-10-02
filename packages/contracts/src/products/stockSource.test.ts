import { describe, expect, it } from "vitest";
import { productsCostCoverage, stockSourceNotice } from "./stockSource";

describe("stockSourceNotice", () => {
  it("is quiet when every variant has a known stock", () => {
    expect(stockSourceNotice({ variants: 10, untracked: 0 })).toBeNull();
  });

  it("asks for a stock source when none is known", () => {
    expect(stockSourceNotice({ variants: 0, untracked: 12 })).toMatch(/Sem fonte de estoque/);
  });

  it("counts the variants left out when some are known", () => {
    expect(stockSourceNotice({ variants: 8, untracked: 1 })).toMatch(/^1 variante/);
    expect(stockSourceNotice({ variants: 8, untracked: 3 })).toMatch(/^3 variantes/);
  });
});

describe("productsCostCoverage", () => {
  it("weighs each product by its revenue", () => {
    const rows = [
      { revenue: 300, cost: 120 },
      { revenue: 100, cost: null },
    ];
    expect(productsCostCoverage(rows)).toBe(75);
  });

  it("is null without sales", () => {
    expect(productsCostCoverage([{ revenue: 0, cost: null }])).toBeNull();
  });
});
