import {
  areaAccessOf,
  grantsOf,
  screenReleaseOf,
  type AuthTokens,
  type AuthUser,
  type InvitationCheck,
  type LoginInput,
  type LoginResponse,
  type RegisterInput,
  type ResetPasswordInput,
  type StoreSummary,
} from "@ecommerce/contracts/auth";
import { prismaClient } from "@ecommerce/database/client";
import { hashPassword, verifyPassword } from "@ecommerce/database/passwordHash";
import type { AccessArea, ClientMembership, StoreScreen } from "@ecommerce/database/enums";
import type { Principal } from "@/shared/http/auth.types";
import { forbidden, HttpError, notFound, unauthorized } from "@/shared/http/httpError";
import type { Mailer } from "@/shared/mail/mailer.types";
import { recordActivity } from "@/modules/audit/contract";
import { passwordResetLink, passwordResetMail } from "./authMail";
import { type StoreAccess } from "./storeAccess";
import {
  ACCESS_TOKEN_SECONDS,
  PASSWORD_RESET_SECONDS,
  REFRESH_TOKEN_SECONDS,
  hashToken,
  newOpaqueToken,
  passwordResetExpiry,
  refreshExpiry,
  signAccessToken,
} from "./tokens";

export type ResetDelivery = { now: () => Date; mailer: Mailer; appUrl: string };

const storeSelect = {
  id: true,
  slug: true,
  name: true,
  onboardedAt: true,
  archivedAt: true,
  releasedScreens: true,
} as const;

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  passwordHash: true,
  clientId: true,
  membership: true,
  viewAreas: true,
  editAreas: true,
} as const;

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: AuthUser["role"];
  clientId: string | null;
  membership: ClientMembership;
  viewAreas: AccessArea[];
  editAreas: AccessArea[];
};

const membershipOf = (u: Pick<UserRow, "role" | "membership">): AuthUser["membership"] =>
  u.role === "CLIENT" ? u.membership : null;

const toStore = (s: {
  id: string;
  slug: string;
  name: string;
  onboardedAt: Date | null;
  archivedAt: Date | null;
  releasedScreens: StoreScreen[];
}): StoreSummary => ({
  id: s.id,
  slug: s.slug,
  name: s.name,
  onboardedAt: s.onboardedAt?.toISOString() ?? null,
  archivedAt: s.archivedAt?.toISOString() ?? null,
  releasedScreens: s.releasedScreens,
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
    select: {
      role: true,
      clientId: true,
      client: { select: { archivedAt: true, releasedScreens: true } },
      assignments: { select: { clientId: true } },
      membership: true,
      viewAreas: true,
      editAreas: true,
    },
  });
  if (!user) throw unauthorized();
  return {
    role: user.role,
    ownClientId: user.clientId,
    ownClientArchived: Boolean(user.client?.archivedAt),
    ownReleasedScreens: user.client?.releasedScreens ?? [],
    assignedClientIds: user.assignments.map((a) => a.clientId),
    areaAccess: areaAccessOf({
      role: user.role,
      membership: membershipOf(user),
      grants: grantsOf(user.viewAreas, user.editAreas),
    }),
    release: screenReleaseOf(user, { releasedScreens: user.client?.releasedScreens ?? [] }),
  };
}

async function toAuthUser(u: UserRow): Promise<AuthUser> {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    membership: membershipOf(u),
    grants: grantsOf(u.viewAreas, u.editAreas),
    stores: await storesOf(u),
  };
}

async function issueTokens(
  user: UserRow,
  secret: string,
  now: Date,
  impersonatorId: string | null = null,
): Promise<AuthTokens> {
  const refreshToken = newOpaqueToken();
  await prismaClient.refreshToken.create({
    data: {
      userId: user.id,
      impersonatorId,
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshExpiry(now),
    },
  });
  const principal: Principal = { userId: user.id, role: user.role };
  if (impersonatorId) principal.impersonatorId = impersonatorId;
  return {
    accessToken: signAccessToken(principal, secret),
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

const invitationSelect = {
  id: true,
  email: true,
  role: true,
  membership: true,
  viewAreas: true,
  editAreas: true,
  clientId: true,
  acceptedAt: true,
  expiresAt: true,
  client: { select: { name: true } },
} as const;

async function pendingInvitation(token: string, now: Date) {
  const invitation = await prismaClient.invitation.findUnique({
    where: { tokenHash: hashToken(token) },
    select: invitationSelect,
  });
  if (!invitation) {
    throw new HttpError(404, "Convite não encontrado. Peça um novo link à sua consultoria.");
  }
  if (invitation.acceptedAt) {
    throw new HttpError(409, "Este convite já foi usado. Entre com sua senha.");
  }
  if (!invitation.expiresAt || invitation.expiresAt <= now) {
    throw new HttpError(410, "Este convite expirou. Peça um novo link à sua consultoria.");
  }
  return invitation;
}

export async function invitationFor(token: string, now: Date): Promise<InvitationCheck> {
  const invitation = await pendingInvitation(token, now);
  return {
    email: invitation.email,
    role: invitation.role,
    membership: invitation.membership,
    storeName: invitation.client?.name ?? null,
  };
}

export type RegisteredUser = { email: string; clientId: string | null };

export async function register(
  input: RegisterInput,
  secret: string,
  now: Date,
  afterRegister: (user: RegisteredUser) => Promise<void>,
) {
  const invitation = await pendingInvitation(input.token, now);
  const user = await prismaClient.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email: invitation.email,
        name: input.name,
        passwordHash: hashPassword(input.password),
        role: invitation.role,
        clientId: invitation.role === "CLIENT" ? invitation.clientId : null,
        membership: invitation.membership,
        viewAreas: invitation.viewAreas,
        editAreas: invitation.editAreas,
      },
      select: userSelect,
    });
    if (invitation.role === "CONSULTANT" && invitation.clientId) {
      await tx.consultantAssignment.create({
        data: { consultantId: created.id, clientId: invitation.clientId },
      });
    }
    await tx.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: now, tokenHash: null },
    });
    return created;
  });
  await recordActivity({ userId: user.id, role: user.role }, invitation.clientId, {
    action: "USER_REGISTERED",
    email: user.email,
  });
  await afterRegister({ email: user.email, clientId: user.clientId });
  return { user: await toAuthUser(user), tokens: await issueTokens(user, secret, now) };
}

export async function refresh(refreshToken: string, secret: string, now: Date) {
  const tokenHash = hashToken(refreshToken);
  const stored = await prismaClient.refreshToken.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      expiresAt: true,
      revokedAt: true,
      impersonatorId: true,
      user: { select: userSelect },
    },
  });
  if (!stored || stored.revokedAt || stored.expiresAt <= now) throw unauthorized();
  await prismaClient.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: now } });
  return { tokens: await issueTokens(stored.user, secret, now, stored.impersonatorId) };
}

export async function impersonate(
  admin: Principal,
  userId: string,
  secret: string,
  now: Date,
): Promise<LoginResponse> {
  if (admin.role !== "ADMIN" || admin.impersonatorId) {
    throw forbidden("Só um administrador acessa como outro usuário.");
  }
  if (admin.userId === userId) throw new HttpError(409, "Você já está na sua própria conta.");
  const user = await prismaClient.user.findUnique({ where: { id: userId }, select: userSelect });
  if (!user) throw notFound("Usuário não encontrado");
  const response = {
    user: await toAuthUser(user),
    tokens: await issueTokens(user, secret, now, admin.userId),
  };
  await recordActivity(admin, user.clientId, {
    action: "USER_IMPERSONATED",
    name: user.name,
    email: user.email,
  });
  return response;
}

export async function logout(refreshToken: string, now: Date) {
  await prismaClient.refreshToken.updateMany({
    where: { tokenHash: hashToken(refreshToken), revokedAt: null },
    data: { revokedAt: now },
  });
}

export async function currentUser(userId: string): Promise<AuthUser> {
  const user = await prismaClient.user.findUnique({ where: { id: userId }, select: userSelect });
  if (!user) throw unauthorized();
  return toAuthUser(user);
}

export async function requestPasswordReset(email: string, delivery: ResetDelivery): Promise<void> {
  const user = await prismaClient.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true },
  });
  if (!user) return;
  const now = delivery.now();
  const token = newOpaqueToken();
  await prismaClient.passwordReset.create({
    data: { userId: user.id, tokenHash: hashToken(token), expiresAt: passwordResetExpiry(now) },
  });
  await delivery.mailer.send(
    passwordResetMail({
      to: user.email,
      name: user.name,
      link: passwordResetLink(delivery.appUrl, token),
      expiresInMinutes: PASSWORD_RESET_SECONDS / 60,
    }),
  );
}

export async function resetPassword(input: ResetPasswordInput, now: Date): Promise<void> {
  const reset = await prismaClient.passwordReset.findUnique({
    where: { tokenHash: hashToken(input.token) },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });
  if (!reset || reset.usedAt || reset.expiresAt <= now) {
    throw new HttpError(400, "Este link é inválido ou expirou. Peça um novo.");
  }
  await prismaClient.$transaction([
    prismaClient.user.update({
      where: { id: reset.userId },
      data: { passwordHash: hashPassword(input.password) },
    }),
    prismaClient.passwordReset.update({ where: { id: reset.id }, data: { usedAt: now } }),
    prismaClient.refreshToken.updateMany({
      where: { userId: reset.userId, revokedAt: null },
      data: { revokedAt: now },
    }),
  ]);
}
