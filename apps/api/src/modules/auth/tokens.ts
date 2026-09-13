import { createHash, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import type { AuthContext } from "@/shared/http/auth.types";

export const ACCESS_TOKEN_SECONDS = 15 * 60;
export const REFRESH_TOKEN_SECONDS = 30 * 24 * 60 * 60;

type AccessClaims = { sub: string; clientId: string; role: AuthContext["role"] };

export function signAccessToken(auth: AuthContext, secret: string): string {
  const claims: AccessClaims = { sub: auth.userId, clientId: auth.clientId, role: auth.role };
  return jwt.sign(claims, secret, { algorithm: "HS256", expiresIn: ACCESS_TOKEN_SECONDS });
}

export function verifyAccessToken(token: string, secret: string): AuthContext | null {
  try {
    const payload = jwt.verify(token, secret, { algorithms: ["HS256"] });
    if (typeof payload === "string") return null;
    const { sub, clientId, role } = payload as jwt.JwtPayload & Partial<AccessClaims>;
    if (typeof sub !== "string" || typeof clientId !== "string" || typeof role !== "string") {
      return null;
    }
    return { userId: sub, clientId, role };
  } catch {
    return null;
  }
}

export function newRefreshToken(): string {
  return randomBytes(48).toString("base64url");
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function refreshExpiry(now: Date): Date {
  return new Date(now.getTime() + REFRESH_TOKEN_SECONDS * 1000);
}
