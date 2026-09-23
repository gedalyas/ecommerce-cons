import { describe, expect, it } from "vitest";
import { dashboardMetricKeys } from "../dashboard/contract";
import { investmentMetrics, sessionMetrics } from "../marketing/contract";
import { explanationOf } from "./metricGlossary";

const unexplained = (keys: readonly string[]) => keys.filter((key) => explanationOf(key) == null);

describe("explanationOf", () => {
  it("explains every metric the dashboard shows", () => {
    expect(unexplained(dashboardMetricKeys)).toEqual([]);
  });

  it("explains every metric the marketing investment and session pickers offer", () => {
    expect(unexplained([...investmentMetrics, ...sessionMetrics])).toEqual([]);
  });

  it("gives a definition and a formula", () => {
    const roas = explanationOf("roas");
    expect(roas?.definition).toContain("R$ 1");
    expect(roas?.formula).toBe("Vendas do site ÷ investimento em anúncios do site");
  });

  it("answers null for a key it does not know", () => {
    expect(explanationOf("unknown")).toBeNull();
  });
});
