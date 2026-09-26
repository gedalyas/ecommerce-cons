import { describe, expect, it } from "vitest";
import { reportFrequencies } from "@ecommerce/contracts/reports";
import { ReportFrequency } from "@ecommerce/database/enums";

describe("reports enums match the contracts", () => {
  it("ReportFrequency", () => {
    expect([...reportFrequencies].sort()).toEqual(Object.values(ReportFrequency).sort());
  });
});
