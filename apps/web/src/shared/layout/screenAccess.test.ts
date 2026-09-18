import { describe, expect, it } from "vitest";
import { canOpenPath, openableItems } from "./screenAccess";

const marketingViewer = [{ area: "MARKETING", level: "view" }] as const;

describe("canOpenPath", () => {
  it("opens everything for unrestricted access", () => {
    expect(canOpenPath("/loja", null)).toBe(true);
    expect(canOpenPath("/dinheiro", null)).toBe(true);
  });

  it("keeps shared screens open and area screens behind the grant", () => {
    expect(canOpenPath("/", marketingViewer)).toBe(true);
    expect(canOpenPath("/conexoes", marketingViewer)).toBe(true);
    expect(canOpenPath("/marketing", marketingViewer)).toBe(true);
    expect(canOpenPath("/influenciadores", marketingViewer)).toBe(true);
    expect(canOpenPath("/dinheiro", marketingViewer)).toBe(false);
    expect(canOpenPath("/loja", marketingViewer)).toBe(false);
  });
});

describe("openableItems", () => {
  it("filters navigation items by the same rule", () => {
    const items = [{ to: "/" }, { to: "/dinheiro" }, { to: "/marketing" }];
    expect(openableItems(items, marketingViewer)).toEqual([{ to: "/" }, { to: "/marketing" }]);
  });
});
