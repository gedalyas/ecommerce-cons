import { createHash, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import type { Principal } from "@/shared/http/auth.types";

export const ACCESS_TOKEN_SECONDS = 15 * 60;
export const REFRESH_TOKEN_SECONDS = 30 * 24 * 60 * 60;

type AccessClaims = { sub: string; role: Principal["role"]; act?: string };

export function signAccessToken(principal: Principal, secret: string): string {
  const claims: AccessClaims = { sub: principal.userId, role: principal.role };
  if (principal.impersonatorId) claims.act = principal.impersonatorId;
  return jwt.sign(claims, secret, { algorithm: "HS256", expiresIn: ACCESS_TOKEN_SECONDS });
}

export function verifyAccessToken(token: string, secret: string): Principal | null {
  try {
    const payload = jwt.verify(token, secret, { algorithms: ["HS256"] });
    if (typeof payload === "string") return null;
    const { sub, role, act } = payload as jwt.JwtPayload & Partial<AccessClaims>;
    if (typeof sub !== "string" || typeof role !== "string") return null;
    return typeof act === "string"
      ? { userId: sub, role, impersonatorId: act }
      : { userId: sub, role };
  } catch {
    return null;
  }
}

export const INVITATION_TOKEN_SECONDS = 7 * 24 * 60 * 60;
export const PASSWORD_RESET_SECONDS = 60 * 60;

export function newOpaqueToken(): string {
  return randomBytes(48).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function refreshExpiry(now: Date): Date {
  return new Date(now.getTime() + REFRESH_TOKEN_SECONDS * 1000);
}

export function invitationExpiry(now: Date): Date {
  return new Date(now.getTime() + INVITATION_TOKEN_SECONDS * 1000);
}

export function passwordResetExpiry(now: Date): Date {
  return new Date(now.getTime() + PASSWORD_RESET_SECONDS * 1000);
}
