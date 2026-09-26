import { describe, expect, it } from "vitest";
import {
  chartSeriesOf,
  reportRequestOf,
  templateSectionsFor,
  toggledSections,
} from "./reportBuilderRules";

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

describe("reportRequestOf", () => {
  it("asks for the chosen range and sections with the screen's granularity, comparison and channel", () => {
    expect(
      reportRequestOf({ inicio: "2026-08-01", fim: "2026-08-31" }, ["kpis"], {
        inicio: "2026-09-01",
        fim: "2026-09-25",
        por: "semana",
        comparar: "nenhum",
        canal: "ecommerce",
      }),
    ).toEqual({
      inicio: "2026-08-01",
      fim: "2026-08-31",
      sections: ["kpis"],
      por: "semana",
      comparar: "nenhum",
      canal: "ecommerce",
    });
  });
});
