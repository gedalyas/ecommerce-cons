import { auditActions, type ActivityPage, type AuditAction } from "@ecommerce/contracts/audit";
import { prismaClient, type Prisma } from "@ecommerce/database/client";
import type { Principal } from "@/shared/http/auth.types";
import type { AuditDetail } from "./audit.types";
import { auditSummary } from "./auditSummary";

const PAGE_SIZE = 50;
const REMOVED_ACTOR = "Usuário removido";

export type AuditActor = Principal | { system: string };

async function actorFields(actor: AuditActor) {
  if ("system" in actor) return { actorId: null, actorName: actor.system, actorRole: null };
  const user = await prismaClient.user.findUnique({
    where: { id: actor.userId },
    select: { name: true },
  });
  return {
    actorId: user ? actor.userId : null,
    actorName: user?.name ?? REMOVED_ACTOR,
    actorRole: actor.role,
  };
}

export async function recordActivity(
  actor: AuditActor,
  clientId: string | null,
  detail: AuditDetail,
): Promise<void> {
  try {
    const { action, ...metadata } = detail;
    await prismaClient.auditEvent.create({
      data: {
        clientId,
        ...(await actorFields(actor)),
        action,
        summary: auditSummary(detail),
        metadata: metadata as Prisma.InputJsonObject,
      },
    });
  } catch (error) {
    console.error(error);
  }
}

const isAction = (value: string): value is AuditAction =>
  (auditActions as readonly string[]).includes(value);

const entrySelect = {
  id: true,
  clientId: true,
  actorName: true,
  actorRole: true,
  action: true,
  summary: true,
  createdAt: true,
  client: { select: { name: true } },
} as const;

type EntryRow = Prisma.AuditEventGetPayload<{ select: typeof entrySelect }>;

const toEntry = (r: EntryRow, action: AuditAction) => ({
  id: r.id,
  storeId: r.clientId,
  storeName: r.client?.name ?? null,
  actorName: r.actorName,
  actorRole: r.actorRole,
  action,
  summary: r.summary,
  createdAt: r.createdAt.toISOString(),
});

async function activityPage(
  where: Prisma.AuditEventWhereInput,
  page: number,
): Promise<ActivityPage> {
  const [total, rows] = await Promise.all([
    prismaClient.auditEvent.count({ where }),
    prismaClient.auditEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: entrySelect,
    }),
  ]);
  return {
    entries: rows.flatMap((r) => (isAction(r.action) ? [toEntry(r, r.action)] : [])),
    page,
    pageSize: PAGE_SIZE,
    total,
  };
}

export async function storeActivity(clientId: string, page: number): Promise<ActivityPage> {
  return activityPage({ clientId }, page);
}

export async function staffActivity(
  principal: Principal,
  visibleClientIds: string[] | null,
  storeId: string | null,
  page: number,
): Promise<ActivityPage> {
  if (storeId) {
    const allowed = !visibleClientIds || visibleClientIds.includes(storeId);
    return activityPage(allowed ? { clientId: storeId } : { id: "" }, page);
  }
  if (!visibleClientIds) return activityPage({}, page);
  return activityPage(
    {
      OR: [{ clientId: { in: visibleClientIds } }, { clientId: null, actorId: principal.userId }],
    },
    page,
  );
}
