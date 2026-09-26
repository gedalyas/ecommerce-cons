import { describe, expect, it } from "vitest";
import { credentialsExpired, failedAccess, REFUSED_MESSAGE } from "./connectionProbe";

const now = new Date("2026-09-25T12:00:00.000Z");

describe("credentialsExpired", () => {
  it("is true only for a stored expiry already past", () => {
    expect(credentialsExpired({ expiresAt: "2026-09-25T11:00:00.000Z" }, now)).toBe(true);
    expect(credentialsExpired({ expiresAt: "2026-09-25T13:00:00.000Z" }, now)).toBe(false);
    expect(credentialsExpired({ accessToken: "x" }, now)).toBe(false);
  });
});

describe("failedAccess", () => {
  it("tells a network failure from a refusal and never echoes the error text", () => {
    const network = new TypeError("fetch failed", { cause: new Error("ECONNREFUSED") });
    expect(failedAccess(network)).toEqual({ status: "unreachable" });
    expect(failedAccess(new Error("Invalid `prisma.connection.update()` invocation"))).toEqual({
      status: "refused",
      message: REFUSED_MESSAGE,
    });
    expect(failedAccess(new TypeError("Cannot read properties of undefined"))).toMatchObject({
      status: "refused",
    });
  });
});
