import { describe, expect, it } from "vitest";
import { storeScreens } from "@ecommerce/contracts/auth";
import { areaRoutePrefixes } from "./areaRoutes";
import { screenRoutePrefixes } from "./screenRoutes";

describe("screenRoutePrefixes", () => {
  it("never shares a prefix between screens and only uses area-guarded paths", () => {
    const all = storeScreens.flatMap((screen) => screenRoutePrefixes[screen]);
    const areaGuarded = Object.values(areaRoutePrefixes).flat();
    expect(all.length).toBe(new Set(all).size);
    for (const prefix of all) {
      expect(prefix).toMatch(/^\/[a-z-]+$/);
      expect(areaGuarded).toContain(prefix);
    }
  });

  it("leaves the assistant to the web, which has no API behind it", () => {
    expect(screenRoutePrefixes.ASSISTANT).toEqual([]);
  });
});
