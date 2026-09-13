import { describe, expect, it } from "vitest";
import { canAccessStore, defaultStoreOf, slugify } from "./storeAccess";

describe("canAccessStore", () => {
  it("lets admins in everywhere, consultants in their portfolio, clients in their own store", () => {
    expect(canAccessStore({ role: "ADMIN", ownClientId: null, assignedClientIds: [] }, "x")).toBe(
      true,
    );
    const consultant = {
      role: "CONSULTANT" as const,
      ownClientId: null,
      assignedClientIds: ["a", "b"],
    };
    expect(canAccessStore(consultant, "a")).toBe(true);
    expect(canAccessStore(consultant, "c")).toBe(false);
    const client = { role: "CLIENT" as const, ownClientId: "a", assignedClientIds: [] };
    expect(canAccessStore(client, "a")).toBe(true);
    expect(canAccessStore(client, "b")).toBe(false);
  });
});

describe("defaultStoreOf", () => {
  it("is the client's store, or the only assigned store, otherwise none", () => {
    expect(defaultStoreOf({ role: "CLIENT", ownClientId: "a", assignedClientIds: [] })).toBe("a");
    expect(
      defaultStoreOf({ role: "CONSULTANT", ownClientId: null, assignedClientIds: ["a"] }),
    ).toBe("a");
    expect(
      defaultStoreOf({ role: "CONSULTANT", ownClientId: null, assignedClientIds: ["a", "b"] }),
    ).toBeNull();
    expect(defaultStoreOf({ role: "ADMIN", ownClientId: null, assignedClientIds: [] })).toBeNull();
  });
});

describe("slugify", () => {
  it("makes a url-safe slug from a store name", () => {
    expect(slugify("Loja da Maria & Cia")).toBe("loja-da-maria-cia");
    expect(slugify("  Ação Móveis ")).toBe("acao-moveis");
  });
});
