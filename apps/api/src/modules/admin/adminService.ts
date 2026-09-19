import type {
  AdminConnectionRequest,
  AdminScreen,
  AdminStore,
  AdminUser,
  AdminUsersScreen,
  ConsultantSummary,
  Invitation,
  InvitationInput,
} from "@ecommerce/contracts/admin";
import {
  connectionRequestStatusLabel,
  connectorOf,
  type ConnectionRequestResolveInput,
  type ConnectorKey,
} from "@ecommerce/contracts/connectors";
import { invitationStatusOf } from "@ecommerce/contracts/admin";
import { orderedScreens, storeScreenLabel, type StoreScreen } from "@ecommerce/contracts/auth";
import { prismaClient, type Prisma } from "@ecommerce/database/client";
import { recordActivity } from "@/modules/audit/contract";
import {
  issueInvitation,
  reissueInvitation,
  type InvitationDelivery,
  type IssueInvitationInput,
} from "@/modules/auth/contract";
import type { Principal } from "@/shared/http/auth.types";
import { forbidden, HttpError, notFound } from "@/shared/http/httpError";

export type { InvitationDelivery };

const staffInvitation = (): Pick<
  IssueInvitationInput,
  "membership" | "viewAreas" | "editAreas"
> => ({
  membership: "OWNER",
  viewAreas: [],
  editAreas: [],
});

const consultantSelect = { id: true, name: true, email: true } as const;

function requireStaff(principal: Principal) {
  if (principal.role === "CLIENT") throw forbidden();
}

export async function visibleClientIds(principal: Principal): Promise<string[] | null> {
  if (principal.role === "ADMIN") return null;
  const rows = await prismaClient.consultantAssignment.findMany({
    where: { consultantId: principal.userId },
    select: { clientId: true },
  });
  return rows.map((r) => r.clientId);
}

async function assertVisible(principal: Principal, clientId: string) {
  const visible = await visibleClientIds(principal);
  if (visible && !visible.includes(clientId)) throw forbidden("Você não acompanha esta loja.");
}

async function storesFor(principal: Principal): Promise<AdminStore[]> {
  const visible = await visibleClientIds(principal);
  const rows = await prismaClient.client.findMany({
    ...(visible ? { where: { id: { in: visible } } } : {}),
    orderBy: { name: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      createdAt: true,
      onboardedAt: true,
      archivedAt: true,
      releasedScreens: true,
      _count: { select: { users: true, connectionRequests: { where: { status: "REQUESTED" } } } },
      consultants: { select: { consultant: { select: consultantSelect } } },
    },
  });
  return rows.map(toAdminStore);
}

const adminStoreSelect = {
  id: true,
  slug: true,
  name: true,
  createdAt: true,
  onboardedAt: true,
  archivedAt: true,
  releasedScreens: true,
  _count: { select: { users: true, connectionRequests: { where: { status: "REQUESTED" } } } },
  consultants: { select: { consultant: { select: consultantSelect } } },
} as const;

type AdminStoreRow = Prisma.ClientGetPayload<{ select: typeof adminStoreSelect }>;

const toAdminStore = (r: AdminStoreRow): AdminStore => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  createdAt: r.createdAt.toISOString(),
  onboardedAt: r.onboardedAt?.toISOString() ?? null,
  archivedAt: r.archivedAt?.toISOString() ?? null,
  users: r._count.users,
  consultants: r.consultants.map((c) => c.consultant),
  pendingRequests: r._count.connectionRequests,
  releasedScreens: r.releasedScreens,
});

export async function setReleasedScreens(
  principal: Principal,
  clientId: string,
  screens: readonly StoreScreen[],
): Promise<AdminStore> {
  requireStaff(principal);
  await assertVisible(principal, clientId);
  const released = orderedScreens(screens);
  const row = await prismaClient.client.update({
    where: { id: clientId },
    data: { releasedScreens: released },
    select: adminStoreSelect,
  });
  await recordActivity(principal, clientId, {
    action: "STORE_SCREENS_RELEASED",
    screens: released.map((screen) => storeScreenLabel[screen]),
  });
  return toAdminStore(row);
}

export async function setStoreArchived(
  principal: Principal,
  id: string,
  archived: boolean,
  now: Date,
): Promise<AdminStore> {
  if (principal.role !== "ADMIN") throw forbidden("Só um administrador arquiva lojas.");
  const existing = await prismaClient.client.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw notFound("Loja não encontrada");
  const row = await prismaClient.client.update({
    where: { id },
    data: { archivedAt: archived ? now : null },
    select: adminStoreSelect,
  });
  await recordActivity(principal, id, {
    action: archived ? "STORE_ARCHIVED" : "STORE_RESTORED",
    storeName: row.name,
  });
  return toAdminStore(row);
}

type InvitationRow = {
  id: string;
  email: string;
  role: Invitation["role"];
  createdAt: Date;
  expiresAt: Date | null;
  acceptedAt: Date | null;
  client: { name: string } | null;
  invitedBy: { name: string } | null;
};

const toInvitation = (r: InvitationRow, now: Date): Invitation => ({
  id: r.id,
  email: r.email,
  role: r.role,
  storeName: r.client?.name ?? null,
  invitedBy: r.invitedBy?.name ?? "—",
  createdAt: r.createdAt.toISOString(),
  expiresAt: r.expiresAt?.toISOString() ?? null,
  acceptedAt: r.acceptedAt?.toISOString() ?? null,
  status: invitationStatusOf(r, now),
});

const invitationSelect = {
  id: true,
  email: true,
  role: true,
  createdAt: true,
  expiresAt: true,
  acceptedAt: true,
  client: { select: { name: true } },
  invitedBy: { select: { name: true } },
} as const;

async function invitationsFor(principal: Principal, now: Date): Promise<Invitation[]> {
  const visible = await visibleClientIds(principal);
  const rows = await prismaClient.invitation.findMany({
    where: {
      membership: "OWNER",
      ...(visible
        ? { OR: [{ clientId: { in: visible } }, { invitedById: principal.userId }] }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    select: invitationSelect,
  });
  return rows.map((r) => toInvitation(r, now));
}

const toRequest = (r: {
  id: string;
  connectorKey: string;
  status: AdminConnectionRequest["status"];
  note: string;
  createdAt: Date;
  resolvedAt: Date | null;
  requestedBy: { name: string } | null;
  client: { id: string; name: string };
}): AdminConnectionRequest => ({
  id: r.id,
  connectorKey: r.connectorKey as ConnectorKey,
  status: r.status,
  note: r.note,
  requestedBy: r.requestedBy?.name ?? "—",
  createdAt: r.createdAt.toISOString(),
  resolvedAt: r.resolvedAt?.toISOString() ?? null,
  storeId: r.client.id,
  storeName: r.client.name,
});

const requestSelect = {
  id: true,
  connectorKey: true,
  status: true,
  note: true,
  createdAt: true,
  resolvedAt: true,
  requestedBy: { select: { name: true } },
  client: { select: { id: true, name: true } },
} as const;

async function requestsFor(principal: Principal): Promise<AdminConnectionRequest[]> {
  const visible = await visibleClientIds(principal);
  const rows = await prismaClient.connectionRequest.findMany({
    ...(visible ? { where: { clientId: { in: visible } } } : {}),
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: requestSelect,
  });
  return rows.map(toRequest);
}

export async function adminScreen(principal: Principal, now: Date): Promise<AdminScreen> {
  requireStaff(principal);
  const [stores, invitations, requests, consultants] = await Promise.all([
    storesFor(principal),
    invitationsFor(principal, now),
    requestsFor(principal),
    principal.role === "ADMIN"
      ? prismaClient.user.findMany({
          where: { role: "CONSULTANT" },
          select: consultantSelect,
          orderBy: { name: "asc" },
        })
      : Promise.resolve([] as ConsultantSummary[]),
  ]);
  return { role: principal.role, stores, consultants, invitations, requests };
}

const adminUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  membership: true,
  clientId: true,
  createdAt: true,
  client: { select: { name: true, consultants: { select: { consultantId: true } } } },
} as const;

type AdminUserRow = Prisma.UserGetPayload<{ select: typeof adminUserSelect }>;

const toAdminUser = (r: AdminUserRow): AdminUser => ({
  id: r.id,
  name: r.name,
  email: r.email,
  role: r.role,
  membership: r.role === "CLIENT" ? r.membership : null,
  storeId: r.clientId,
  storeName: r.client?.name ?? null,
  consultantIds: r.client?.consultants.map((c) => c.consultantId) ?? [],
  createdAt: r.createdAt.toISOString(),
});

export async function adminUsersScreen(principal: Principal): Promise<AdminUsersScreen> {
  if (principal.role !== "ADMIN") throw forbidden("Só um administrador vê os usuários.");
  const [users, consultants] = await Promise.all([
    prismaClient.user.findMany({ orderBy: { name: "asc" }, select: adminUserSelect }),
    prismaClient.user.findMany({
      where: { role: "CONSULTANT" },
      select: consultantSelect,
      orderBy: { name: "asc" },
    }),
  ]);
  return { users: users.map(toAdminUser), consultants };
}

export async function createInvitation(
  principal: Principal,
  input: InvitationInput,
  delivery: InvitationDelivery,
): Promise<Invitation> {
  requireStaff(principal);
  if (input.role === "CONSULTANT" && principal.role !== "ADMIN") {
    throw forbidden("Só um administrador convida consultores.");
  }
  if (input.clientId) await assertVisible(principal, input.clientId);
  const taken = await prismaClient.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (taken) throw new HttpError(409, "Este e-mail já tem cadastro.");
  const row = await issueInvitation({ ...input, ...staffInvitation() }, principal.userId, delivery);
  await recordActivity(principal, row.client ? input.clientId : null, {
    action: "INVITATION_CREATED",
    email: row.email,
    role: row.role,
    storeName: row.client?.name ?? null,
  });
  return toInvitation(row, delivery.now());
}

export async function inviteFromSale(email: string, delivery: InvitationDelivery): Promise<void> {
  const pending = await prismaClient.invitation.findUnique({
    where: { email },
    select: { acceptedAt: true, expiresAt: true },
  });
  if (pending && !pending.acceptedAt && pending.expiresAt && pending.expiresAt > delivery.now()) {
    return;
  }
  const row = await issueInvitation(
    { email, role: "CLIENT", clientId: null, ...staffInvitation() },
    null,
    delivery,
  );
  await recordActivity({ system: "Guru" }, null, {
    action: "INVITATION_CREATED",
    email: row.email,
    role: row.role,
    storeName: null,
  });
}

export async function resendInvitation(
  principal: Principal,
  id: string,
  delivery: InvitationDelivery,
): Promise<Invitation> {
  requireStaff(principal);
  const existing = await prismaClient.invitation.findUnique({
    where: { id },
    select: { clientId: true, acceptedAt: true },
  });
  if (!existing) throw notFound("Convite não encontrado");
  if (existing.acceptedAt) throw new HttpError(409, "Este convite já foi usado.");
  if (existing.clientId) await assertVisible(principal, existing.clientId);
  const row = await reissueInvitation(id, delivery);
  await recordActivity(principal, existing.clientId, {
    action: "INVITATION_RESENT",
    email: row.email,
    role: row.role,
    storeName: row.client?.name ?? null,
  });
  return toInvitation(row, delivery.now());
}

export async function revokeInvitation(principal: Principal, id: string): Promise<void> {
  requireStaff(principal);
  const row = await prismaClient.invitation.findUnique({
    where: { id },
    select: {
      clientId: true,
      acceptedAt: true,
      email: true,
      role: true,
      client: { select: { name: true } },
    },
  });
  if (!row) throw notFound("Convite não encontrado");
  if (row.acceptedAt) throw new HttpError(409, "Este convite já foi usado.");
  if (row.clientId) await assertVisible(principal, row.clientId);
  await prismaClient.invitation.delete({ where: { id } });
  await recordActivity(principal, row.clientId, {
    action: "INVITATION_REVOKED",
    email: row.email,
    role: row.role,
    storeName: row.client?.name ?? null,
  });
}

export async function assignConsultants(
  principal: Principal,
  clientId: string,
  consultantIds: string[],
): Promise<ConsultantSummary[]> {
  if (principal.role !== "ADMIN") throw forbidden("Só um administrador atribui consultores.");
  const consultants = await prismaClient.user.findMany({
    where: { id: { in: consultantIds }, role: "CONSULTANT" },
    select: consultantSelect,
  });
  await prismaClient.$transaction([
    prismaClient.consultantAssignment.deleteMany({ where: { clientId } }),
    prismaClient.consultantAssignment.createMany({
      data: consultants.map((c) => ({ clientId, consultantId: c.id })),
    }),
  ]);
  await recordActivity(principal, clientId, {
    action: "CONSULTANTS_ASSIGNED",
    names: consultants.map((c) => c.name),
  });
  return consultants;
}

export async function resolveRequest(
  principal: Principal,
  id: string,
  input: ConnectionRequestResolveInput,
  now: Date,
): Promise<AdminConnectionRequest> {
  requireStaff(principal);
  const existing = await prismaClient.connectionRequest.findUnique({
    where: { id },
    select: { clientId: true },
  });
  if (!existing) throw notFound("Solicitação não encontrada");
  await assertVisible(principal, existing.clientId);
  const resolved = input.status === "DONE" || input.status === "DECLINED";
  const row = await prismaClient.connectionRequest.update({
    where: { id },
    data: { status: input.status, note: input.note, resolvedAt: resolved ? now : null },
    select: requestSelect,
  });
  await recordActivity(principal, existing.clientId, {
    action: "CONNECTION_REQUEST_RESOLVED",
    connector: connectorOf(row.connectorKey as ConnectorKey).label,
    status: connectionRequestStatusLabel[row.status],
  });
  return toRequest(row);
}
