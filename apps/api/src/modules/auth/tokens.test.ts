import { describe, expect, it } from "vitest";
import {
  hashToken,
  newOpaqueToken,
  refreshExpiry,
  signAccessToken,
  verifyAccessToken,
} from "./tokens";

const secret = "a-test-secret-with-at-least-32-characters";
const auth = { userId: "u1", role: "CONSULTANT" as const };

describe("access tokens", () => {
  it("round-trips the auth context", () => {
    expect(verifyAccessToken(signAccessToken(auth, secret), secret)).toEqual(auth);
  });

  it("carries who is behind an impersonated session", () => {
    const impersonated = { ...auth, impersonatorId: "admin-1" };
    expect(verifyAccessToken(signAccessToken(impersonated, secret), secret)).toEqual(impersonated);
    expect(verifyAccessToken(signAccessToken(auth, secret), secret)).not.toHaveProperty(
      "impersonatorId",
    );
  });

  it("rejects another secret or garbage", () => {
    const other = "another-secret-of-32-characters!!";
    expect(verifyAccessToken(signAccessToken(auth, secret), other)).toBeNull();
    expect(verifyAccessToken("nope", secret)).toBeNull();
  });
});

describe("refresh tokens", () => {
  it("are random, url-safe and hashed with sha256", () => {
    const token = newOpaqueToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{64}$/);
    expect(newOpaqueToken()).not.toBe(token);
    expect(hashToken(token)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("expire 30 days after issue", () => {
    expect(refreshExpiry(new Date("2026-09-10T00:00:00Z")).toISOString()).toBe(
      "2026-10-10T00:00:00.000Z",
    );
  });
});
