import { describe, expect, it } from "vitest";
import { grantsOfPicker, pickerOfGrants } from "./grantPicker";

describe("grant picker", () => {
  it("starts every area at none and applies the grants", () => {
    expect(pickerOfGrants([{ area: "MARKETING", level: "edit" }])).toEqual({
      MONEY: "none",
      MARKETING: "edit",
      LOGISTICS: "none",
      MANAGEMENT: "none",
      DATA: "none",
    });
  });

  it("round-trips back to grants in the canonical order", () => {
    const grants = [
      { area: "MARKETING", level: "edit" },
      { area: "DATA", level: "view" },
    ] as const;
    expect(grantsOfPicker(pickerOfGrants(grants))).toEqual(grants);
  });
});
