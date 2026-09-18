import { describe, expect, it } from "vitest";
import { canAccessStore, defaultStoreOf, isBlockedByArchive, slugify } from "./storeAccess";

describe("canAccessStore", () => {
  it("lets admins in everywhere, consultants in their portfolio, clients in their own store", () => {
    expect(
      canAccessStore(
        {
          role: "ADMIN",
          ownClientId: null,
          ownClientArchived: false,
          assignedClientIds: [],
          areaAccess: null,
        },
        "x",
      ),
    ).toBe(true);
    const consultant = {
      role: "CONSULTANT" as const,
      ownClientId: null,
      ownClientArchived: false,
      assignedClientIds: ["a", "b"],
      areaAccess: null,
    };
    expect(canAccessStore(consultant, "a")).toBe(true);
    expect(canAccessStore(consultant, "c")).toBe(false);
    const client = {
      role: "CLIENT" as const,
      ownClientId: "a",
      ownClientArchived: false,
      assignedClientIds: [],
      areaAccess: null,
    };
    expect(canAccessStore(client, "a")).toBe(true);
    expect(canAccessStore(client, "b")).toBe(false);
  });
});

describe("defaultStoreOf", () => {
  it("is the client's store, or the only assigned store, otherwise none", () => {
    expect(
      defaultStoreOf({
        role: "CLIENT",
        ownClientId: "a",
        ownClientArchived: false,
        assignedClientIds: [],
        areaAccess: null,
      }),
    ).toBe("a");
    expect(
      defaultStoreOf({
        role: "CONSULTANT",
        ownClientId: null,
        ownClientArchived: false,
        assignedClientIds: ["a"],
        areaAccess: null,
      }),
    ).toBe("a");
    expect(
      defaultStoreOf({
        role: "CONSULTANT",
        ownClientId: null,
        ownClientArchived: false,
        assignedClientIds: ["a", "b"],
        areaAccess: null,
      }),
    ).toBeNull();
    expect(
      defaultStoreOf({
        role: "ADMIN",
        ownClientId: null,
        ownClientArchived: false,
        assignedClientIds: [],
        areaAccess: null,
      }),
    ).toBeNull();
  });
});

describe("slugify", () => {
  it("makes a url-safe slug from a store name", () => {
    expect(slugify("Loja da Maria & Cia")).toBe("loja-da-maria-cia");
    expect(slugify("  Ação Móveis ")).toBe("acao-moveis");
  });
});

describe("isBlockedByArchive", () => {
  it("blocks only a client whose own store is archived", () => {
    const archived = {
      role: "CLIENT" as const,
      ownClientId: "a",
      ownClientArchived: true,
      assignedClientIds: [],
      areaAccess: null,
    };
    expect(isBlockedByArchive(archived, "a")).toBe(true);
    expect(isBlockedByArchive({ ...archived, ownClientArchived: false }, "a")).toBe(false);
    expect(isBlockedByArchive({ ...archived, role: "ADMIN" }, "a")).toBe(false);
  });
});
