import { describe, expect, it } from "vitest";
import { planYearOf, planYearsAround, trailingTwelveMonths } from "./planCalendar";

describe("planYearOf", () => {
  it("defaults to the current year and keeps a chosen one", () => {
    expect(planYearOf(null, "2026-10-02")).toBe(2026);
    expect(planYearOf(2027, "2026-10-02")).toBe(2027);
  });
});

describe("planYearsAround", () => {
  it("offers last year, this year and next year", () => {
    expect(planYearsAround("2026-10-02", 2026)).toEqual([2025, 2026, 2027]);
  });

  it("keeps a chosen year outside that range", () => {
    expect(planYearsAround("2026-10-02", 2030)).toEqual([2025, 2026, 2027, 2030]);
  });
});

describe("trailingTwelveMonths", () => {
  it("covers the twelve full months before the current one", () => {
    expect(trailingTwelveMonths("2026-10-02")).toEqual({ inicio: "2025-10-01", fim: "2026-09-30" });
    expect(trailingTwelveMonths("2027-01-15")).toEqual({ inicio: "2026-01-01", fim: "2026-12-31" });
  });
});
