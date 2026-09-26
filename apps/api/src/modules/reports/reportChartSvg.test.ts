import { describe, expect, it } from "vitest";
import { reportPalette } from "@ecommerce/contracts/reports";
import { chartSvgOf } from "./reportChartSvg";

const block = (chart: "bars" | "lines", values: number[][]) => ({
  kind: "chart" as const,
  chart,
  unit: "currency" as const,
  buckets: ["2026-09-01", "2026-09-02", "2026-09-03"],
  series: values.map((v, i) => ({ key: `s${i}`, label: `Série ${i}`, values: v })),
});

describe("chartSvgOf", () => {
  it("draws one polyline per series for a line chart", () => {
    const svg = chartSvgOf(
      block("lines", [
        [1, 2, 3],
        [3, 2, 1],
      ]),
      reportPalette,
    );
    expect(svg.match(/<polyline/g)).toHaveLength(2);
    expect(svg).toContain(`stroke="${reportPalette.series[1]}"`);
  });

  it("draws one bar per value, grouped by bucket", () => {
    const svg = chartSvgOf(
      block("bars", [
        [1, 2, 3],
        [3, 2, 1],
      ]),
      reportPalette,
    );
    expect(svg.match(/<rect/g)).toHaveLength(6);
  });

  it("labels the first, middle and last bucket and the value axis compactly, like the screens", () => {
    const svg = chartSvgOf(block("lines", [[0, 500, 1000]]), reportPalette);
    expect(svg).toContain(">01/09<");
    expect(svg).toContain(">02/09<");
    expect(svg).toContain(">03/09<");
    expect(svg).toContain(">1,0k<");
  });

  it("stays drawable when every value is zero", () => {
    const svg = chartSvgOf(block("bars", [[0, 0, 0]]), reportPalette);
    expect(svg).not.toContain("NaN");
    expect(svg).not.toContain("Infinity");
  });
});
