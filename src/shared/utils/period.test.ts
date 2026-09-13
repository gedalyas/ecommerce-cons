import { describe, expect, it } from "vitest";
import {
  defaultPeriodSearch,
  fromIsoDate,
  matchingPreset,
  parsePeriodSearch,
  periodPresets,
  rangeLength,
  resolveComparison,
} from "./period";

const today = fromIsoDate("2026-09-10");
const preset = (key: string) => periodPresets.find((p) => p.key === key)!.range(today);

describe("periodPresets", () => {
  it("counts the last 30 days inclusively", () => {
    expect(preset("ultimos-30-dias")).toEqual({ inicio: "2026-08-12", fim: "2026-09-10" });
    expect(rangeLength(preset("ultimos-30-dias"))).toBe(30);
  });

  it("starts weeks on Monday", () => {
    expect(preset("esta-semana")).toEqual({ inicio: "2026-09-07", fim: "2026-09-10" });
    expect(preset("semana-passada")).toEqual({ inicio: "2026-08-31", fim: "2026-09-06" });
  });

  it("closes last month on its last day", () => {
    expect(preset("mes-passado")).toEqual({ inicio: "2026-08-01", fim: "2026-08-31" });
  });

  it("recognises a range that matches a preset", () => {
    expect(matchingPreset(preset("ultimos-90-dias"), today)).toBe("ultimos-90-dias");
    expect(matchingPreset({ inicio: "2026-01-01", fim: "2026-01-15" }, today)).toBeUndefined();
  });
});

describe("resolveComparison", () => {
  const search = {
    inicio: "2026-09-01",
    fim: "2026-09-10",
    por: "dia",
    comparar: "nenhum",
  } as const;

  it("returns null when comparison is off", () => {
    expect(resolveComparison(search)).toBeNull();
  });

  it("shifts by the same length for the previous period", () => {
    expect(resolveComparison({ ...search, comparar: "periodo-anterior" })).toEqual({
      inicio: "2026-08-22",
      fim: "2026-08-31",
    });
  });

  it("shifts by calendar month and year", () => {
    expect(resolveComparison({ ...search, comparar: "mes-anterior" })).toEqual({
      inicio: "2026-08-01",
      fim: "2026-08-10",
    });
    expect(resolveComparison({ ...search, comparar: "ano-anterior" })).toEqual({
      inicio: "2025-09-01",
      fim: "2025-09-10",
    });
  });
});

describe("parsePeriodSearch", () => {
  it("falls back to the defaults for missing or malformed values", () => {
    expect(parsePeriodSearch({})).toEqual(defaultPeriodSearch);
    expect(parsePeriodSearch({ inicio: "not-a-date", por: "hora", comparar: "x" })).toEqual(
      defaultPeriodSearch,
    );
  });

  it("swaps an inverted range instead of rejecting it", () => {
    expect(parsePeriodSearch({ inicio: "2026-09-10", fim: "2026-09-01" })).toMatchObject({
      inicio: "2026-09-01",
      fim: "2026-09-10",
    });
  });
});
