import type {
  AdminConnectionRequest,
  AdminScreen,
  AdminStore,
  ConsultantSummary,
  Invitation,
  InvitationInput,
} from "@ecommerce/contracts/admin";
import type { ConnectionRequestResolveInput, ConnectorKey } from "@ecommerce/contracts/connectors";
import { prismaClient } from "@ecommerce/database/client";
import type { Principal } from "@/shared/http/auth.types";
import { forbidden, HttpError, notFound } from "@/shared/http/httpError";

const consultantSelect = { id: true, name: true, email: true } as const;

function requireStaff(principal: Principal) {
  if (principal.role === "CLIENT") throw forbidden();
}

async function visibleClientIds(principal: Principal): Promise<string[] | null> {
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
      _count: { select: { users: true, connectionRequests: { where: { status: "REQUESTED" } } } },
      consultants: { select: { consultant: { select: consultantSelect } } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    createdAt: r.createdAt.toISOString(),
    onboardedAt: r.onboardedAt?.toISOString() ?? null,
    users: r._count.users,
    consultants: r.consultants.map((c) => c.consultant),
    pendingRequests: r._count.connectionRequests,
  }));
}

const toInvitation = (r: {
  id: string;
  email: string;
  role: Invitation["role"];
  createdAt: Date;
  acceptedAt: Date | null;
  client: { name: string } | null;
  invitedBy: { name: string } | null;
}): Invitation => ({
  id: r.id,
  email: r.email,
  role: r.role,
  storeName: r.client?.name ?? null,
  invitedBy: r.invitedBy?.name ?? "—",
  createdAt: r.createdAt.toISOString(),
  acceptedAt: r.acceptedAt?.toISOString() ?? null,
});

const invitationSelect = {
  id: true,
  email: true,
  role: true,
  createdAt: true,
  acceptedAt: true,
  client: { select: { name: true } },
  invitedBy: { select: { name: true } },
} as const;

async function invitationsFor(principal: Principal): Promise<Invitation[]> {
  const visible = await visibleClientIds(principal);
  const rows = await prismaClient.invitation.findMany({
    ...(visible
      ? { where: { OR: [{ clientId: { in: visible } }, { invitedById: principal.userId }] } }
      : {}),
    orderBy: { createdAt: "desc" },
    select: invitationSelect,
  });
  return rows.map(toInvitation);
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

export async function adminScreen(principal: Principal): Promise<AdminScreen> {
  requireStaff(principal);
  const [stores, invitations, requests, consultants] = await Promise.all([
    storesFor(principal),
    invitationsFor(principal),
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

export async function createInvitation(
  principal: Principal,
  input: InvitationInput,
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
  const row = await prismaClient.invitation.upsert({
    where: { email: input.email },
    create: {
      email: input.email,
      role: input.role,
      clientId: input.clientId,
      invitedById: principal.userId,
    },
    update: {
      role: input.role,
      clientId: input.clientId,
      invitedById: principal.userId,
      acceptedAt: null,
    },
    select: invitationSelect,
  });
  return toInvitation(row);
}

export async function revokeInvitation(principal: Principal, id: string): Promise<void> {
  requireStaff(principal);
  const row = await prismaClient.invitation.findUnique({
    where: { id },
    select: { clientId: true, acceptedAt: true },
  });
  if (!row) throw notFound("Convite não encontrado");
  if (row.acceptedAt) throw new HttpError(409, "Este convite já foi usado.");
  if (row.clientId) await assertVisible(principal, row.clientId);
  await prismaClient.invitation.delete({ where: { id } });
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
  return toRequest(row);
}
