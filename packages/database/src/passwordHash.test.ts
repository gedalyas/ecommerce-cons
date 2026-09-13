import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./passwordHash";

describe("passwordHash", () => {
  it("verifies the password it hashed and rejects another one", () => {
    const stored = hashPassword("aurora2026");
    expect(stored).toMatch(/^[0-9a-f]{32}:[0-9a-f]{128}$/);
    expect(verifyPassword("aurora2026", stored)).toBe(true);
    expect(verifyPassword("aurora2027", stored)).toBe(false);
  });

  it("salts every hash", () => {
    expect(hashPassword("x")).not.toBe(hashPassword("x"));
  });

  it("rejects a malformed stored value", () => {
    expect(verifyPassword("x", "not-a-hash")).toBe(false);
  });
});
