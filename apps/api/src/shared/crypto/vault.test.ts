import { describe, expect, it } from "vitest";
import { createVault, vaultKeyOf } from "./vault";

const key = vaultKeyOf(Buffer.alloc(32, 7).toString("base64"));

describe("vault", () => {
  it("round-trips a JSON value and never repeats the ciphertext", () => {
    const vault = createVault(key);
    const secret = { accessToken: "abc", storeId: 42, nested: { ok: true } };
    const a = vault.seal(secret);
    const b = vault.seal(secret);
    expect(a).not.toBe(b);
    expect(vault.open(a)).toEqual(secret);
    expect(vault.open(b)).toEqual(secret);
  });
  it("refuses a tampered blob and a wrong key", () => {
    const vault = createVault(key);
    const sealed = vault.seal({ token: "x" });
    const tampered = Buffer.from(sealed, "base64");
    const last = tampered.length - 1;
    tampered.writeUInt8(tampered.readUInt8(last) ^ 0xff, last);
    expect(() => vault.open(tampered.toString("base64"))).toThrow();
    const other = createVault(vaultKeyOf(Buffer.alloc(32, 9).toString("base64")));
    expect(() => other.open(sealed)).toThrow();
  });
  it("rejects a key of the wrong size", () => {
    expect(() => vaultKeyOf(Buffer.alloc(16).toString("base64"))).toThrow(/32 bytes/);
  });
});
