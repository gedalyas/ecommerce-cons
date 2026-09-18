import { invitationStatusOf } from "@ecommerce/contracts/admin";
import { areasOfGrants, grantLabels, grantsOf, type AreaGrant } from "@ecommerce/contracts/auth";
import {
  seatLimitMessage,
  teamSeatsOf,
  type TeamInvitation,
  type TeamInviteInput,
  type TeamMember,
  type TeamScreen,
} from "@ecommerce/contracts/team";
import type { AccessArea } from "@ecommerce/database/enums";
import { prismaClient } from "@ecommerce/database/client";
import { recordActivity } from "@/modules/audit/contract";
import {
  assertOwner,
  issueInvitation,
  issuedInvitationSelect,
  reissueInvitation,
  type InvitationDelivery,
  type IssuedInvitationRow,
} from "@/modules/auth/contract";
import type { AuthContext } from "@/shared/http/auth.types";
import { HttpError, notFound } from "@/shared/http/httpError";

const memberSelect = {
  id: true,
  name: true,
  email: true,
  viewAreas: true,
  editAreas: true,
  createdAt: true,
} as const;

type MemberRow = {
  id: string;
  name: string;
  email: string;
  viewAreas: AccessArea[];
  editAreas: AccessArea[];
  createdAt: Date;
};

const toMember = (row: MemberRow): TeamMember => ({
  id: row.id,
  name: row.name,
  email: row.email,
  grants: grantsOf(row.viewAreas, row.editAreas),
  createdAt: row.createdAt.toISOString(),
});

const toTeamInvitation = (row: IssuedInvitationRow, now: Date): TeamInvitation => ({
  id: row.id,
  email: row.email,
  grants: grantsOf(row.viewAreas, row.editAreas),
  createdAt: row.createdAt.toISOString(),
  expiresAt: row.expiresAt?.toISOString() ?? null,
  status: invitationStatusOf(row, now),
});

const memberWhere = (clientId: string) => ({
  clientId,
  role: "CLIENT" as const,
  membership: "MEMBER" as const,
});
const invitationWhere = (clientId: string) => ({
  clientId,
  membership: "MEMBER" as const,
  acceptedAt: null,
});

async function seatsOf(clientId: string, now: Date) {
  const [store, members, pendingInvitations] = await Promise.all([
    prismaClient.client.findUnique({ where: { id: clientId }, select: { teamSeatLimit: true } }),
    prismaClient.user.count({ where: memberWhere(clientId) }),
    prismaClient.invitation.count({
      where: { ...invitationWhere(clientId), expiresAt: { gt: now } },
    }),
  ]);
  if (!store) throw notFound("Loja não encontrada");
  return teamSeatsOf({ members, pendingInvitations, limit: store.teamSeatLimit });
}

export async function teamScreen(auth: AuthContext, now: Date): Promise<TeamScreen> {
  assertOwner(auth);
  const [seats, members, invitations] = await Promise.all([
    seatsOf(auth.clientId, now),
    prismaClient.user.findMany({
      where: memberWhere(auth.clientId),
      select: memberSelect,
      orderBy: { createdAt: "asc" },
    }),
    prismaClient.invitation.findMany({
      where: invitationWhere(auth.clientId),
      select: issuedInvitationSelect,
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return {
    seats,
    members: members.map(toMember),
    invitations: invitations.map((row) => toTeamInvitation(row, now)),
  };
}

export async function inviteMember(
  auth: AuthContext,
  input: TeamInviteInput,
  delivery: InvitationDelivery,
): Promise<TeamInvitation> {
  assertOwner(auth);
  const now = delivery.now();
  const seats = await seatsOf(auth.clientId, now);
  if (!seats.hasFree) throw new HttpError(422, seatLimitMessage(seats.limit));
  const taken = await prismaClient.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (taken) throw new HttpError(409, "Este e-mail já tem cadastro.");
  const foreign = await prismaClient.invitation.findUnique({
    where: { email: input.email },
    select: { clientId: true, membership: true },
  });
  if (foreign && !(foreign.membership === "MEMBER" && foreign.clientId === auth.clientId)) {
    throw new HttpError(409, "Este e-mail já foi convidado por outra loja ou pela consultoria.");
  }
  const row = await issueInvitation(
    {
      email: input.email,
      role: "CLIENT",
      clientId: auth.clientId,
      membership: "MEMBER",
      ...areasOfGrants(input.grants),
    },
    auth.userId,
    delivery,
  );
  await recordActivity(auth, auth.clientId, {
    action: "TEAM_MEMBER_INVITED",
    email: row.email,
    areas: grantLabels(input.grants),
  });
  return toTeamInvitation(row, now);
}

async function ownInvitation(auth: AuthContext, id: string) {
  const row = await prismaClient.invitation.findFirst({
    where: { id, ...invitationWhere(auth.clientId) },
    select: { id: true, email: true, viewAreas: true, editAreas: true },
  });
  if (!row) throw notFound("Convite não encontrado");
  return row;
}

export async function resendMemberInvitation(
  auth: AuthContext,
  id: string,
  delivery: InvitationDelivery,
): Promise<TeamInvitation> {
  assertOwner(auth);
  const existing = await ownInvitation(auth, id);
  const row = await reissueInvitation(existing.id, delivery);
  await recordActivity(auth, auth.clientId, {
    action: "TEAM_MEMBER_INVITED",
    email: row.email,
    areas: grantLabels(grantsOf(row.viewAreas, row.editAreas)),
  });
  return toTeamInvitation(row, delivery.now());
}

export async function revokeMemberInvitation(auth: AuthContext, id: string): Promise<void> {
  assertOwner(auth);
  const existing = await ownInvitation(auth, id);
  await prismaClient.invitation.delete({ where: { id: existing.id } });
  await recordActivity(auth, auth.clientId, {
    action: "TEAM_INVITATION_REVOKED",
    email: existing.email,
    areas: grantLabels(grantsOf(existing.viewAreas, existing.editAreas)),
  });
}

async function ownMember(auth: AuthContext, id: string) {
  const row = await prismaClient.user.findFirst({
    where: { id, ...memberWhere(auth.clientId) },
    select: memberSelect,
  });
  if (!row) throw notFound("Membro não encontrado");
  return row;
}

export async function updateMember(
  auth: AuthContext,
  id: string,
  grants: AreaGrant[],
): Promise<TeamMember> {
  assertOwner(auth);
  const existing = await ownMember(auth, id);
  const row = await prismaClient.user.update({
    where: { id: existing.id },
    data: areasOfGrants(grants),
    select: memberSelect,
  });
  await recordActivity(auth, auth.clientId, {
    action: "TEAM_MEMBER_UPDATED",
    name: row.name,
    areas: grantLabels(grants),
  });
  return toMember(row);
}

export async function removeMember(auth: AuthContext, id: string): Promise<void> {
  assertOwner(auth);
  const existing = await ownMember(auth, id);
  await prismaClient.$transaction([
    prismaClient.user.delete({ where: { id: existing.id } }),
    prismaClient.invitation.deleteMany({ where: { email: existing.email } }),
  ]);
  await recordActivity(auth, auth.clientId, { action: "TEAM_MEMBER_REMOVED", name: existing.name });
}
