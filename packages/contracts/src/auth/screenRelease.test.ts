import { describe, expect, it } from "vitest";
import { isScreenReleased, orderedScreens, screenReleaseOf } from "./screenRelease";
import { defaultReleasedScreens } from "./storeScreens";

const store = { releasedScreens: ["MARKETING", "ORDERS"] as const };

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
    expect(isScreenReleased(store.releasedScreens, "ORDERS")).toBe(true);
    expect(isScreenReleased(store.releasedScreens, "MONEY")).toBe(false);
  });

  it("opens every screen, the assistant included, to a new store", () => {
    expect(isScreenReleased(defaultReleasedScreens, "MONEY")).toBe(true);
    expect(isScreenReleased(defaultReleasedScreens, "INFLUENCERS")).toBe(true);
    expect(isScreenReleased(defaultReleasedScreens, "ASSISTANT")).toBe(true);
  });
});

describe("orderedScreens", () => {
  it("keeps the canonical order and drops duplicates", () => {
    expect(orderedScreens(["ORDERS", "MONEY", "ORDERS"])).toEqual(["MONEY", "ORDERS"]);
  });
});
