import { describe, expect, it } from "vitest";
import { metricValue, variationOf } from "./metricValue";

describe("variationOf", () => {
  it("returns the percent change against the previous value", () => {
    expect(variationOf(110, 100)).toBeCloseTo(10);
    expect(variationOf(90, 100)).toBeCloseTo(-10);
  });

  it("is null without a comparison or when the previous value is zero", () => {
    expect(variationOf(110, null)).toBeNull();
    expect(variationOf(null, 100)).toBeNull();
    expect(variationOf(110, 0)).toBeNull();
  });
});

describe("metricValue", () => {
  it("packs value, unit, previous and variation together", () => {
    expect(metricValue("currency", 250, 200)).toEqual({
      value: 250,
      unit: "currency",
      previous: 200,
      variation: 25,
    });
  });
});
