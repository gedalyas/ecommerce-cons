import { describe, expect, it } from "vitest";
import { formatReportCell } from "./reportFormat";

describe("formatReportCell", () => {
  it("formats numbers by unit and shows a dash for no value", () => {
    expect(formatReportCell(null, "currency")).toBe("—");
    expect(formatReportCell("", "text")).toBe("—");
    expect(formatReportCell("Site", "text")).toBe("Site");
    expect(formatReportCell(3, "count")).toBe("3");
    expect(formatReportCell(2.5, "multiplier")).toContain("2,5");
  });
});
