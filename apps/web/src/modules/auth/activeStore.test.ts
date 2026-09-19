import { describe, expect, it } from "vitest";
import { activeStoreOf } from "./activeStore";

const stores = [
  { id: "a", slug: "a", name: "A", onboardedAt: null, archivedAt: null, releasedScreens: [] },
  { id: "b", slug: "b", name: "B", onboardedAt: null, archivedAt: null, releasedScreens: [] },
];

describe("activeStoreOf", () => {
  it("keeps the preferred store when available, else falls back to the first", () => {
    expect(activeStoreOf(stores, "b")?.id).toBe("b");
    expect(activeStoreOf(stores, "zzz")?.id).toBe("a");
    expect(activeStoreOf(stores, null)?.id).toBe("a");
    expect(activeStoreOf([], "a")).toBeNull();
  });
});
