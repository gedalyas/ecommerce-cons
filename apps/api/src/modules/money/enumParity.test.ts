import { describe, expect, it } from "vitest";
import { businessUnits, costCategories, costFrequencies } from "@ecommerce/contracts/money";
import { BusinessUnit, CostCategory, CostFrequency } from "@ecommerce/database/enums";

describe("money closed sets", () => {
  it("match the Prisma enums", () => {
    expect([...businessUnits].sort()).toEqual(Object.values(BusinessUnit).sort());
    expect([...costCategories].sort()).toEqual(Object.values(CostCategory).sort());
    expect([...costFrequencies].sort()).toEqual(Object.values(CostFrequency).sort());
  });
});
