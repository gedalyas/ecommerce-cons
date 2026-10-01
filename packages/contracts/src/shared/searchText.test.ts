import { describe, expect, it } from "vitest";
import { foldForSearch } from "./searchText";

describe("foldForSearch", () => {
  it("drops accents, case and surrounding spaces", () => {
    expect(foldForSearch("  Gestão Ágil ")).toBe("gestao agil");
  });

  it("keeps an empty text empty", () => {
    expect(foldForSearch("   ")).toBe("");
  });
});
