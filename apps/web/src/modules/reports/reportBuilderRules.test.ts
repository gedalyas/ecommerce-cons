import { describe, expect, it } from "vitest";
import {
  chartSeriesOf,
  formatReportCell,
  templateSectionsFor,
  toggledSections,
} from "./reportBuilderRules";

describe("formatReportCell", () => {
  it("formats numbers by unit and shows a dash for no value", () => {
    expect(formatReportCell(null, "currency")).toBe("—");
    expect(formatReportCell("Site", "text")).toBe("Site");
    expect(formatReportCell(3, "count")).toBe("3");
    expect(formatReportCell(2.5, "multiplier")).toContain("2,5");
  });
});

describe("chartSeriesOf", () => {
  it("pairs each value with its bucket", () => {
    expect(
      chartSeriesOf({
        kind: "chart",
        chart: "lines",
        unit: "currency",
        buckets: ["2026-09-01", "2026-09-02"],
        series: [{ key: "sold", label: "Vendido", values: [10] }],
      }),
    ).toEqual([
      {
        key: "sold",
        label: "Vendido",
        points: [
          { bucket: "2026-09-01", value: 10 },
          { bucket: "2026-09-02", value: 0 },
        ],
      },
    ]);
  });
});

describe("toggledSections", () => {
  it("adds and removes a section, keeping the catalogue's order", () => {
    expect(toggledSections(["meta"], "kpis")).toEqual(["kpis", "meta"]);
    expect(toggledSections(["kpis", "meta"], "kpis")).toEqual(["meta"]);
  });
});

describe("templateSectionsFor", () => {
  it("keeps only the template's sections the person can see", () => {
    expect(templateSectionsFor("weekly", ["kpis", "salesVsInvestment", "topProducts"])).toEqual([
      "kpis",
      "salesVsInvestment",
    ]);
  });
});
