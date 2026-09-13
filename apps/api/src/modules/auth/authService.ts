import type {
  AuthTokens,
  AuthUser,
  InvitationCheck,
  LoginInput,
  RegisterInput,
  StoreSummary,
} from "@ecommerce/contracts/auth";
import { prismaClient } from "@ecommerce/database/client";
import { hashPassword, verifyPassword } from "@ecommerce/database/passwordHash";
import type { Principal } from "@/shared/http/auth.types";
import { HttpError, unauthorized } from "@/shared/http/httpError";
import { type StoreAccess } from "./storeAccess";
import {
  ACCESS_TOKEN_SECONDS,
  REFRESH_TOKEN_SECONDS,
  hashRefreshToken,
  newRefreshToken,
  refreshExpiry,
  signAccessToken,
} from "./tokens";

const storeSelect = { id: true, slug: true, name: true, onboardedAt: true } as const;

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  passwordHash: true,
  clientId: true,
} as const;

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: AuthUser["role"];
  clientId: string | null;
};

const toStore = (s: {
  id: string;
  slug: string;
  name: string;
  onboardedAt: Date | null;
}): StoreSummary => ({
  id: s.id,
  slug: s.slug,
  name: s.name,
  onboardedAt: s.onboardedAt?.toISOString() ?? null,
});

export async function storesOf(
  user: Pick<UserRow, "id" | "role" | "clientId">,
): Promise<StoreSummary[]> {
  if (user.role === "ADMIN") {
    const rows = await prismaClient.client.findMany({
      select: storeSelect,
      orderBy: { name: "asc" },
    });
    return rows.map(toStore);
  }
  if (user.role === "CONSULTANT") {
    const rows = await prismaClient.consultantAssignment.findMany({
      where: { consultantId: user.id },
      select: { client: { select: storeSelect } },
      orderBy: { client: { name: "asc" } },
    });
    return rows.map((r) => toStore(r.client));
  }
  if (!user.clientId) return [];
  const own = await prismaClient.client.findUnique({
    where: { id: user.clientId },
    select: storeSelect,
  });
  return own ? [toStore(own)] : [];
}

export async function storeAccessOf(principal: Principal): Promise<StoreAccess> {
  const user = await prismaClient.user.findUnique({
    where: { id: principal.userId },
    select: { role: true, clientId: true, assignments: { select: { clientId: true } } },
  });
  if (!user) throw unauthorized();
  return {
    role: user.role,
    ownClientId: user.clientId,
    assignedClientIds: user.assignments.map((a) => a.clientId),
  };
}

async function toAuthUser(u: UserRow): Promise<AuthUser> {
  return { id: u.id, name: u.name, email: u.email, role: u.role, stores: await storesOf(u) };
}

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
    accessToken: signAccessToken({ userId: user.id, role: user.role }, secret),
    accessExpiresIn: ACCESS_TOKEN_SECONDS,
    refreshToken,
    refreshExpiresIn: REFRESH_TOKEN_SECONDS,
  };
}

export async function login(input: LoginInput, secret: string, now: Date) {
  const user = await prismaClient.user.findUnique({
    where: { email: input.email },
    select: userSelect,
  });
  if (!user || !verifyPassword(input.password, user.passwordHash)) {
    throw unauthorized("E-mail ou senha incorretos");
  }
  return { user: await toAuthUser(user), tokens: await issueTokens(user, secret, now) };
}

export async function invitationFor(email: string): Promise<InvitationCheck> {
  const invitation = await prismaClient.invitation.findUnique({
    where: { email },
    select: { role: true, acceptedAt: true, client: { select: { name: true } } },
  });
  if (!invitation)
    throw new HttpError(404, "Este e-mail ainda não foi liberado. Fale com sua consultoria.");
  if (invitation.acceptedAt)
    throw new HttpError(409, "Este e-mail já tem cadastro. Entre com sua senha.");
  return { email, role: invitation.role, storeName: invitation.client?.name ?? null };
}

export async function register(input: RegisterInput, secret: string, now: Date) {
  await invitationFor(input.email);
  const invitation = await prismaClient.invitation.findUniqueOrThrow({
    where: { email: input.email },
  });
  const user = await prismaClient.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash: hashPassword(input.password),
        role: invitation.role,
        clientId: invitation.role === "CLIENT" ? invitation.clientId : null,
      },
      select: userSelect,
    });
    if (invitation.role === "CONSULTANT" && invitation.clientId) {
      await tx.consultantAssignment.create({
        data: { consultantId: created.id, clientId: invitation.clientId },
      });
    }
    await tx.invitation.update({ where: { id: invitation.id }, data: { acceptedAt: now } });
    return created;
  });
  return { user: await toAuthUser(user), tokens: await issueTokens(user, secret, now) };
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
