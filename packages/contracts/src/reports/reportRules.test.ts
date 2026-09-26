import { describe, expect, it } from "vitest";
import { sectionsVisibleTo, templateRange } from "./reportRules";

describe("sectionsVisibleTo", () => {
  it("gives owners and staff every section", () => {
    expect(sectionsVisibleTo(null, null)).toHaveLength(10);
  });

  it("drops marketing sections for a member without the Marketing area", () => {
    const sections = sectionsVisibleTo([{ area: "MONEY", level: "view" }], null);
    expect(sections).toContain("kpis");
    expect(sections).not.toContain("meta");
    expect(sections).not.toContain("investmentFunnel");
  });

  it("drops marketing sections while the Marketing screen is not released to the store", () => {
    expect(sectionsVisibleTo(null, ["ORDERS"])).not.toContain("google");
    expect(sectionsVisibleTo(null, ["MARKETING"])).toContain("google");
  });
});

describe("templateRange", () => {
  it("covers last week for the weekly meeting and last month for the monthly close", () => {
    expect(templateRange("weekly", "2026-09-25")).toEqual({
      inicio: "2026-09-14",
      fim: "2026-09-20",
    });
    expect(templateRange("monthly", "2026-09-25")).toEqual({
      inicio: "2026-08-01",
      fim: "2026-08-31",
    });
  });
});
