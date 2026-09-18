import { describe, expect, it } from "vitest";
import { editableImportKinds } from "./importAccess";

describe("editableImportKinds", () => {
  it("is every kind for unrestricted access", () => {
    expect(editableImportKinds(null)).toEqual(["ORDERS", "AD_SPEND", "TRAFFIC"]);
  });

  it("follows the edit grants of the member", () => {
    expect(editableImportKinds([{ area: "MARKETING", level: "edit" }])).toEqual([
      "AD_SPEND",
      "TRAFFIC",
    ]);
    expect(editableImportKinds([{ area: "DATA", level: "view" }])).toEqual([]);
  });
});
