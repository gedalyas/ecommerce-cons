import type { AuthTokens, AuthUser, LoginInput } from "@ecommerce/contracts/auth";
import { prismaClient } from "@ecommerce/database/client";
import { verifyPassword } from "@ecommerce/database/passwordHash";
import type { AuthContext } from "@/shared/http/auth.types";
import { unauthorized } from "@/shared/http/httpError";
import {
  ACCESS_TOKEN_SECONDS,
  REFRESH_TOKEN_SECONDS,
  hashRefreshToken,
  newRefreshToken,
  refreshExpiry,
  signAccessToken,
} from "./tokens";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  passwordHash: true,
  client: { select: { id: true, slug: true, name: true } },
} as const;

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: AuthUser["role"];
  client: AuthUser["client"];
};

const toAuthUser = (u: UserRow): AuthUser => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  client: u.client,
});

const contextOf = (u: UserRow): AuthContext => ({
  userId: u.id,
  clientId: u.client.id,
  role: u.role,
});

async function issueTokens(user: UserRow, secret: string, now: Date): Promise<AuthTokens> {
  const refreshToken = newRefreshToken();
  await prismaClient.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: refreshExpiry(now),
    },
  });
  return {
    accessToken: signAccessToken(contextOf(user), secret),
    accessExpiresIn: ACCESS_TOKEN_SECONDS,
    refreshToken,
    refreshExpiresIn: REFRESH_TOKEN_SECONDS,
  };
}

export async function login(input: LoginInput, secret: string, now: Date) {
  const user = await prismaClient.user.findUnique({
    where: { email: input.email.toLowerCase() },
    select: userSelect,
  });
  if (!user || !verifyPassword(input.password, user.passwordHash)) {
    throw unauthorized("E-mail ou senha incorretos");
  }
  return { user: toAuthUser(user), tokens: await issueTokens(user, secret, now) };
}

export async function refresh(refreshToken: string, secret: string, now: Date) {
  const tokenHash = hashRefreshToken(refreshToken);
  const stored = await prismaClient.refreshToken.findUnique({
    where: { tokenHash },
    select: { id: true, expiresAt: true, revokedAt: true, user: { select: userSelect } },
  });
  if (!stored || stored.revokedAt || stored.expiresAt <= now) throw unauthorized();
  await prismaClient.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: now } });
  return { tokens: await issueTokens(stored.user, secret, now) };
}

export async function logout(refreshToken: string, now: Date) {
  await prismaClient.refreshToken.updateMany({
    where: { tokenHash: hashRefreshToken(refreshToken), revokedAt: null },
    data: { revokedAt: now },
  });
}

export async function currentUser(userId: string): Promise<AuthUser> {
  const user = await prismaClient.user.findUnique({ where: { id: userId }, select: userSelect });
  if (!user) throw unauthorized();
  return toAuthUser(user);
}
