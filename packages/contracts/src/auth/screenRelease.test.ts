import { describe, expect, it } from "vitest";
import { isScreenReleased, orderedScreens, screenReleaseOf } from "./screenRelease";
import { defaultReleasedScreens } from "./storeScreens";

const store = { releasedScreens: defaultReleasedScreens };

describe("screenReleaseOf", () => {
  it("never restricts staff", () => {
    expect(screenReleaseOf({ role: "ADMIN" }, store)).toBeNull();
    expect(screenReleaseOf({ role: "CONSULTANT" }, store)).toBeNull();
  });

  it("gives a client exactly what the store released", () => {
    expect(screenReleaseOf({ role: "CLIENT" }, store)).toEqual(["MARKETING", "ORDERS"]);
  });

  it("releases nothing for a client without an active store", () => {
    expect(screenReleaseOf({ role: "CLIENT" }, null)).toEqual([]);
  });
});

describe("isScreenReleased", () => {
  it("treats null as unrestricted", () => {
    expect(isScreenReleased(null, "MONEY")).toBe(true);
  });

  it("checks the list otherwise", () => {
    expect(isScreenReleased(defaultReleasedScreens, "ORDERS")).toBe(true);
    expect(isScreenReleased(defaultReleasedScreens, "MONEY")).toBe(false);
  });
});

describe("orderedScreens", () => {
  it("keeps the canonical order and drops duplicates", () => {
    expect(orderedScreens(["ORDERS", "MONEY", "ORDERS"])).toEqual(["MONEY", "ORDERS"]);
  });
});
