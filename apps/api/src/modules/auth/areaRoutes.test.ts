import { describe, expect, it } from "vitest";
import { accessAreas } from "@ecommerce/contracts/auth";
import { areaRoutePrefixes, levelRequiredBy } from "./areaRoutes";

describe("areaRoutePrefixes", () => {
  it("gives every area at least one prefix and never shares a prefix", () => {
    const all = accessAreas.flatMap((area) => areaRoutePrefixes[area]);
    expect(all.length).toBe(new Set(all).size);
    for (const area of accessAreas) expect(areaRoutePrefixes[area].length).toBeGreaterThan(0);
    for (const prefix of all) expect(prefix).toMatch(/^\/[a-z-]+$/);
  });
});

describe("levelRequiredBy", () => {
  it("reads need view, everything else needs edit", () => {
    expect(levelRequiredBy("get")).toBe("view");
    expect(levelRequiredBy("HEAD")).toBe("view");
    expect(levelRequiredBy("POST")).toBe("edit");
    expect(levelRequiredBy("DELETE")).toBe("edit");
  });
});
