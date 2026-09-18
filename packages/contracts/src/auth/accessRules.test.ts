import { describe, expect, it } from "vitest";
import {
  areaAccessOf,
  areasOfGrants,
  canEditArea,
  canEditEveryArea,
  canViewArea,
  grantLabels,
  grantsOf,
  levelOfArea,
} from "./accessRules";

const marketingEditor = [
  { area: "MARKETING", level: "edit" },
  { area: "DATA", level: "view" },
] as const;

describe("grantsOf", () => {
  it("prefers edit over view and keeps the canonical area order", () => {
    expect(grantsOf(["DATA", "MARKETING"], ["MARKETING"])).toEqual([
      { area: "MARKETING", level: "edit" },
      { area: "DATA", level: "view" },
    ]);
  });

  it("treats an edit area as viewable even when it is missing from viewAreas", () => {
    expect(grantsOf([], ["MONEY"])).toEqual([{ area: "MONEY", level: "edit" }]);
  });
});

describe("areasOfGrants", () => {
  it("lists every granted area as viewable and the edit ones separately", () => {
    expect(areasOfGrants(marketingEditor)).toEqual({
      viewAreas: ["MARKETING", "DATA"],
      editAreas: ["MARKETING"],
    });
  });

  it("round-trips with grantsOf", () => {
    const { viewAreas, editAreas } = areasOfGrants(marketingEditor);
    expect(grantsOf(viewAreas, editAreas)).toEqual(marketingEditor);
  });
});

describe("areaAccessOf", () => {
  it("is unrestricted for staff and for the store owner", () => {
    expect(areaAccessOf({ role: "ADMIN", membership: null, grants: [] })).toBeNull();
    expect(areaAccessOf({ role: "CONSULTANT", membership: null, grants: [] })).toBeNull();
    expect(areaAccessOf({ role: "CLIENT", membership: "OWNER", grants: [] })).toBeNull();
  });

  it("is the grants for a team member", () => {
    expect(areaAccessOf({ role: "CLIENT", membership: "MEMBER", grants: marketingEditor })).toEqual(
      marketingEditor,
    );
  });
});

describe("grantLabels", () => {
  it("names each area with its level in Portuguese", () => {
    expect(grantLabels(marketingEditor)).toEqual(["Marketing (editar)", "Dados (ver)"]);
  });
});

describe("area checks", () => {
  it("unrestricted access edits everything", () => {
    expect(levelOfArea(null, "LOGISTICS")).toBe("edit");
    expect(canEditEveryArea(null, ["MONEY", "DATA"])).toBe(true);
  });

  it("a member views what was granted and edits only the edit grants", () => {
    expect(canViewArea(marketingEditor, "DATA")).toBe(true);
    expect(canEditArea(marketingEditor, "DATA")).toBe(false);
    expect(canEditArea(marketingEditor, "MARKETING")).toBe(true);
    expect(canViewArea(marketingEditor, "MONEY")).toBe(false);
    expect(canEditEveryArea(marketingEditor, ["MARKETING", "DATA"])).toBe(false);
    expect(canEditEveryArea(marketingEditor, ["MARKETING"])).toBe(true);
  });
});
