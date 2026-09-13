import { describe, expect, it } from "vitest";
import { importKinds, importStatuses } from "@ecommerce/contracts/imports";
import { ImportKind, ImportStatus } from "@ecommerce/database/enums";

describe("imports enums match the contracts", () => {
  it("ImportKind", () => {
    expect([...importKinds].sort()).toEqual(Object.values(ImportKind).sort());
  });
  it("ImportStatus", () => {
    expect([...importStatuses].sort()).toEqual(Object.values(ImportStatus).sort());
  });
});
