import { describe, expect, it } from "vitest";
import { todayIso } from "./clock";

describe("todayIso", () => {
  it("formats the UTC day of the given instant", () => {
    expect(todayIso(new Date("2026-09-13T23:30:00Z"))).toBe("2026-09-13");
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
