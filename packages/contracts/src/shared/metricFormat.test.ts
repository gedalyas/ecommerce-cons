import { describe, expect, it } from "vitest";
import { formatMetric, formatMetricCompact } from "./metricFormat";

describe("formatMetric", () => {
  it("formats by unit in pt-BR", () => {
    expect(formatMetric(1234.5, "currency")).toBe("R$ 1.235");
    expect(formatMetric(1.254, "currency")).toBe("R$ 1,25");
    expect(formatMetric(1234, "count")).toBe("1.234");
    expect(formatMetric(19.25, "percent")).toBe("19,3%");
    expect(formatMetric(3.1, "multiplier")).toBe("3,10x");
    expect(formatMetric(4.5, "days")).toBe("4,5 dias");
    expect(formatMetric(83.4, "seconds")).toBe("1 min 23 s");
    expect(formatMetric(42, "seconds")).toBe("42 s");
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
    expect(formatMetricCompact(1.5, "percent")).toBe("1,5%");
    expect(formatMetricCompact(2, "percent")).toBe("2%");
  });
});
