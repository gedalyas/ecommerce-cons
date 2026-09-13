import type { ImportKind } from "@ecommerce/contracts/imports";
import { Prisma, prismaClient } from "@ecommerce/database/client";
import { refreshCustomers } from "@/modules/customers/contract";
import { HttpError, notFound } from "@/shared/http/httpError";
import { connectorKeysOfKind, manualConnector } from "./importSources";
import type { OrderSnapshot, UndoEntry, UndoPlan } from "./importUndo.types";
import { isUndoEntity, undoPlanOf } from "./undoPlan";

const CHUNK = 200;
const UNDO_DEPTH = 3;

const dayOf = (day: string) => new Date(`${day}T00:00:00.000Z`);

function chunks<T>(items: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += CHUNK) out.push(items.slice(i, i + CHUNK));
  return out;
}

type Tx = Prisma.TransactionClient;

export async function saveUndoEntries(
  clientId: string,
  kind: ImportKind,
  jobId: string,
  entries: UndoEntry[],
): Promise<void> {
  for (const group of chunks(entries)) {
    await prismaClient.importUndo.createMany({
      data: group.map((e) => ({
        jobId,
        entity: e.entity,
        key: e.key,
        previous: e.previous === null ? Prisma.JsonNull : (e.previous as Prisma.InputJsonValue),
      })),
    });
  }
  const kept = await prismaClient.importJob.findMany({
    where: { clientId, kind, status: { not: "UNDONE" } },
    orderBy: { createdAt: "desc" },
    take: UNDO_DEPTH,
    select: { id: true },
  });
  await prismaClient.importUndo.deleteMany({
    where: { jobId: { notIn: kept.map((j) => j.id) }, job: { clientId, kind } },
  });
}

export async function undoableJobIds(clientId: string): Promise<Set<string>> {
  const latest = await prismaClient.importJob.findMany({
    where: { clientId, status: { not: "UNDONE" } },
    orderBy: { createdAt: "desc" },
    distinct: ["kind"],
    select: { id: true, _count: { select: { undoEntries: true } } },
  });
  return new Set(latest.filter((j) => j._count.undoEntries > 0).map((j) => j.id));
}

async function restoreOrder(tx: Tx, clientId: string, number: string, snapshot: OrderSnapshot) {
  const { items, placedAt, paidAt, ...rest } = snapshot;
  const data = { ...rest, placedAt: new Date(placedAt), paidAt: paidAt ? new Date(paidAt) : null };
  const saved = await tx.order.upsert({
    where: { clientId_number: { clientId, number } },
    create: { clientId, number, ...data },
    update: data,
    select: { id: true },
  });
  await tx.orderItem.deleteMany({ where: { orderId: saved.id } });
  await tx.orderItem.createMany({ data: items.map((i) => ({ ...i, orderId: saved.id })) });
}

async function undoOrders(clientId: string, plan: UndoPlan) {
  for (const group of chunks(plan.ordersToDelete)) {
    await prismaClient.order.deleteMany({ where: { clientId, number: { in: group } } });
  }
  for (const group of chunks(plan.ordersToRestore)) {
    await prismaClient.$transaction(async (tx) => {
      for (const { number, snapshot } of group) await restoreOrder(tx, clientId, number, snapshot);
    });
  }
  for (const { email, name } of plan.customersToRename) {
    await prismaClient.customer.updateMany({ where: { clientId, email }, data: { name } });
  }
  for (const group of chunks(plan.customersToDelete)) {
    await prismaClient.customer.deleteMany({
      where: { clientId, email: { in: group }, orders: { none: {} } },
    });
  }
  for (const group of chunks(plan.productsToDelete)) {
    await prismaClient.product.deleteMany({
      where: { clientId, id: { in: group }, items: { none: {} } },
    });
  }
}

async function undoAdSpend(clientId: string, plan: UndoPlan) {
  for (const { key, rows } of plan.adSpendDays) {
    const where = { clientId, platform: key.platform, date: dayOf(key.date) };
    await prismaClient.$transaction(async (tx) => {
      await tx.adSpendDaily.deleteMany({ where });
      if (rows.length > 0) {
        await tx.adSpendDaily.createMany({ data: rows.map((r) => ({ ...where, ...r })) });
      }
    });
  }
}

async function undoTraffic(clientId: string, plan: UndoPlan) {
  for (const group of chunks(plan.traffic)) {
    await prismaClient.$transaction(async (tx) => {
      for (const { key, previous } of group) {
        const where = { clientId, date: dayOf(key.date), source: key.source, medium: key.medium };
        await tx.trafficDaily.deleteMany({ where });
        if (previous) await tx.trafficDaily.create({ data: { ...where, ...previous } });
      }
    });
  }
}

async function restampSources(
  clientId: string,
  keys: string[],
  remainingJobFinishedAt: Date | null,
) {
  if (keys.length === 0) return;
  if (remainingJobFinishedAt) {
    await prismaClient.dataSource.updateMany({
      where: { clientId, connectorKey: { in: keys } },
      data: { lastSyncedAt: remainingJobFinishedAt },
    });
    return;
  }
  await prismaClient.dataSource.updateMany({
    where: { clientId, connectorKey: { in: keys }, status: "MANUAL" },
    data: { status: "NOT_CONNECTED", lastSyncedAt: null },
  });
}

async function restampAfterUndo(clientId: string, kind: ImportKind) {
  const latestOf = (where: Prisma.ImportJobWhereInput) =>
    prismaClient.importJob.findFirst({
      where: { clientId, status: { not: "UNDONE" }, rowsImported: { gt: 0 }, ...where },
      orderBy: { createdAt: "desc" },
      select: { finishedAt: true },
    });
  const [sameKind, anyKind] = await Promise.all([latestOf({ kind }), latestOf({})]);
  await restampSources(clientId, connectorKeysOfKind[kind], sameKind?.finishedAt ?? null);
  await restampSources(clientId, [manualConnector], anyKind?.finishedAt ?? null);
}

function toUndoEntries(rows: { entity: string; key: string; previous: unknown }[]): UndoEntry[] {
  return rows.flatMap((row) =>
    isUndoEntity(row.entity)
      ? [{ entity: row.entity, key: row.key, previous: row.previous ?? null } as UndoEntry]
      : [],
  );
}

export async function undoImport(clientId: string, id: string, now: Date): Promise<void> {
  const job = await prismaClient.importJob.findFirst({
    where: { clientId, id },
    select: { id: true, kind: true, status: true, createdAt: true },
  });
  if (!job) throw notFound("Importação não encontrada");
  if (job.status === "UNDONE") throw new HttpError(409, "Esta importação já foi desfeita.");
  const newer = await prismaClient.importJob.findFirst({
    where: {
      clientId,
      kind: job.kind,
      status: { not: "UNDONE" },
      createdAt: { gt: job.createdAt },
    },
    select: { id: true },
  });
  if (newer) {
    throw new HttpError(409, "Só a importação mais recente de cada tipo pode ser desfeita.");
  }
  const rows = await prismaClient.importUndo.findMany({
    where: { jobId: job.id },
    select: { entity: true, key: true, previous: true },
  });
  if (rows.length === 0) throw new HttpError(409, "Esta importação não pode mais ser desfeita.");
  const plan = undoPlanOf(toUndoEntries(rows));
  await undoOrders(clientId, plan);
  await undoAdSpend(clientId, plan);
  await undoTraffic(clientId, plan);
  await prismaClient.importJob.update({
    where: { id: job.id },
    data: { status: "UNDONE", undoneAt: now },
  });
  await prismaClient.importUndo.deleteMany({ where: { jobId: job.id } });
  await restampAfterUndo(clientId, job.kind);
  if (job.kind === "ORDERS") await refreshCustomers(clientId);
}
