import { describe, expect, it } from "vitest";
import {
  hashRefreshToken,
  newRefreshToken,
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

  it("rejects another secret or garbage", () => {
    const other = "another-secret-of-32-characters!!";
    expect(verifyAccessToken(signAccessToken(auth, secret), other)).toBeNull();
    expect(verifyAccessToken("nope", secret)).toBeNull();
  });
});

describe("refresh tokens", () => {
  it("are random, url-safe and hashed with sha256", () => {
    const token = newRefreshToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{64}$/);
    expect(newRefreshToken()).not.toBe(token);
    expect(hashRefreshToken(token)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("expire 30 days after issue", () => {
    expect(refreshExpiry(new Date("2026-09-10T00:00:00Z")).toISOString()).toBe(
      "2026-10-10T00:00:00.000Z",
    );
  });
});
