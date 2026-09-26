import { describe, expect, it } from "vitest";
import { reportRequestSchema } from "./reportsSchema";

describe("reportRequestSchema", () => {
  it("accepts sections and a range, filling the period defaults", () => {
    expect(
      reportRequestSchema.parse({ sections: ["kpis"], inicio: "2026-09-01", fim: "2026-09-30" }),
    ).toEqual({
      sections: ["kpis"],
      inicio: "2026-09-01",
      fim: "2026-09-30",
      por: "dia",
      comparar: "periodo-anterior",
      canal: "todos",
    });
  });

  it("refuses no section, an unknown section, an inverted range and more than a year", () => {
    const base = { inicio: "2026-09-01", fim: "2026-09-30" };
    expect(reportRequestSchema.safeParse({ ...base, sections: [] }).success).toBe(false);
    expect(reportRequestSchema.safeParse({ ...base, sections: ["nope"] }).success).toBe(false);
    expect(
      reportRequestSchema.safeParse({ sections: ["kpis"], inicio: "2026-09-30", fim: "2026-09-01" })
        .success,
    ).toBe(false);
    expect(
      reportRequestSchema.safeParse({ sections: ["kpis"], inicio: "2025-01-01", fim: "2026-09-01" })
        .success,
    ).toBe(false);
  });
});
