import { describe, expect, it } from "vitest";
import { formatMetric, formatMetricCompact, metricValue, variationOf } from "./metricFormat";

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

describe("formatMetric", () => {
  it("formats by unit in pt-BR", () => {
    expect(formatMetric(1234.5, "currency")).toBe("R$ 1.235");
    expect(formatMetric(1.254, "currency")).toBe("R$ 1,25");
    expect(formatMetric(1234, "count")).toBe("1.234");
    expect(formatMetric(19.25, "percent")).toBe("19,3%");
    expect(formatMetric(3.1, "multiplier")).toBe("3,10x");
    expect(formatMetric(4.5, "days")).toBe("4,5 dias");
  });

  it("renders a dash for a missing value", () => {
    expect(formatMetric(null, "currency")).toBe("—");
  });
});

describe("formatMetricCompact", () => {
  it("shortens large numbers for axis ticks", () => {
    expect(formatMetricCompact(12500, "currency")).toBe("12,5k");
    expect(formatMetricCompact(250000, "currency")).toBe("250k");
    expect(formatMetricCompact(800, "count")).toBe("800");
    expect(formatMetricCompact(18.4, "percent")).toBe("18%");
  });
});
