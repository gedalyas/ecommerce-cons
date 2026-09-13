import { describe, expect, it } from "vitest";
import { invitationStatusOf } from "./invitationStatus";

const now = new Date("2026-09-13T12:00:00Z");

describe("invitationStatusOf", () => {
  it("is accepted once used, whatever the expiry", () => {
    expect(
      invitationStatusOf({ acceptedAt: now, expiresAt: new Date("2026-01-01T00:00:00Z") }, now),
    ).toBe("ACCEPTED");
  });
  it("is pending while the token is in the future", () => {
    expect(
      invitationStatusOf({ acceptedAt: null, expiresAt: new Date("2026-09-14T12:00:00Z") }, now),
    ).toBe("PENDING");
  });
  it("is expired at the expiry instant, or without a token", () => {
    expect(invitationStatusOf({ acceptedAt: null, expiresAt: now }, now)).toBe("EXPIRED");
    expect(invitationStatusOf({ acceptedAt: null, expiresAt: null }, now)).toBe("EXPIRED");
  });
});
