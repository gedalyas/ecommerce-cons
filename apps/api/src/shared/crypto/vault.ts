import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const IV_BYTES = 12;
const TAG_BYTES = 16;

export type Vault = {
  seal(value: unknown): string;
  open<T>(sealed: string): T;
};

export function vaultKeyOf(base64: string): Buffer {
  const key = Buffer.from(base64, "base64");
  if (key.length !== KEY_BYTES) {
    throw new Error("CREDENTIALS_KEY must be 32 bytes encoded in base64");
  }
  return key;
}

export function createVault(key: Buffer): Vault {
  return {
    seal(value) {
      const iv = randomBytes(IV_BYTES);
      const cipher = createCipheriv(ALGORITHM, key, iv);
      const body = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
      return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64");
    },
    open<T>(sealed: string): T {
      const raw = Buffer.from(sealed, "base64");
      const iv = raw.subarray(0, IV_BYTES);
      const tag = raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
      const body = raw.subarray(IV_BYTES + TAG_BYTES);
      const decipher = createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(tag);
      const json = Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8");
      return JSON.parse(json) as T;
    },
  };
}
