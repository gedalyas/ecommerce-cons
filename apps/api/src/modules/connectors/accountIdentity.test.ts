import { describe, expect, it } from "vitest";
import { accountExternalId, isPlaceholderId } from "./accountIdentity";

describe("accountExternalId", () => {
  it("keeps the seller id the platform reports", () => {
    expect(accountExternalId({ reported: "123456", reconnecting: null, fresh: "x" })).toBe(
      "123456",
    );
  });

  it("gives every new login of a platform without a seller id its own account", () => {
    expect(accountExternalId({ reported: "bling", reconnecting: null, fresh: "a1" })).toBe(
      "bling:a1",
    );
  });

  it("tells a platform's stand-in id from a seller id", () => {
    expect(isPlaceholderId("bling")).toBe(true);
    expect(isPlaceholderId("123456")).toBe(false);
  });

  it("reconnects such a login to the account it already had", () => {
    expect(accountExternalId({ reported: "bling", reconnecting: "bling:a1", fresh: "b2" })).toBe(
      "bling:a1",
    );
  });
});
