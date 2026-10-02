import { describe, expect, it } from "vitest";
import { isMoneyInRange, isStockInRange } from "./productLimits";

describe("product limits", () => {
  it("accepts money from 0 to the Decimal(12,2) ceiling", () => {
    expect(isMoneyInRange(null)).toBe(true);
    expect(isMoneyInRange(0)).toBe(true);
    expect(isMoneyInRange(9_999_999_999.99)).toBe(true);
    expect(isMoneyInRange(1e12)).toBe(false);
    expect(isMoneyInRange(-1)).toBe(false);
  });

  it("accepts a stock that fits an int column, negative included", () => {
    expect(isStockInRange(null)).toBe(true);
    expect(isStockInRange(-5)).toBe(true);
    expect(isStockInRange(3e9)).toBe(false);
  });
});
