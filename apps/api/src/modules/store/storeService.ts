import type { StoreSummary } from "@ecommerce/contracts/auth";
import { connectorCatalog, connectorKindLabel } from "@ecommerce/contracts/connectors";
import { engagementTemplate, milestoneTemplate } from "@ecommerce/contracts/consulting";
import type { Store, StoreProfileParsed } from "@ecommerce/contracts/store";
import { prismaClient } from "@ecommerce/database/client";
import { provisionStore } from "@ecommerce/database/provisionStore";
import { slugify } from "@/modules/auth/contract";
import type { Principal } from "@/shared/http/auth.types";
import { forbidden, HttpError, notFound } from "@/shared/http/httpError";

const storeSelect = {
  id: true,
  slug: true,
  name: true,
  segment: true,
  platform: true,
  monthlyRevenueBand: true,
  timezone: true,
  createdAt: true,
  onboardedAt: true,
} as const;

type StoreRow = {
  id: string;
  slug: string;
  name: string;
  segment: string | null;
  platform: string | null;
  monthlyRevenueBand: string | null;
  timezone: string;
  createdAt: Date;
  onboardedAt: Date | null;
};

const toStore = (row: StoreRow): Store => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  segment: row.segment as Store["segment"],
  platform: row.platform as Store["platform"],
  monthlyRevenueBand: row.monthlyRevenueBand as Store["monthlyRevenueBand"],
  timezone: row.timezone,
  createdAt: row.createdAt.toISOString(),
  onboardedAt: row.onboardedAt?.toISOString() ?? null,
});

async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || "loja";
  for (let attempt = 0; attempt < 50; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const taken = await prismaClient.client.findUnique({ where: { slug }, select: { id: true } });
    if (!taken) return slug;
  }
  throw new HttpError(409, "Não foi possível gerar um identificador para a loja.");
}

export const provisionPlan = () => ({
  pillars: engagementTemplate.flatMap((area) =>
    area.pillars.map((p) => ({
      areaKey: area.key,
      key: p.key,
      status: p.blockedByMilestone ? ("BLOCKED" as const) : ("NOT_STARTED" as const),
    })),
  ),
  milestones: milestoneTemplate.map((m) => ({ key: m.key })),
  dataSources: connectorCatalog.map((c) => ({
    connectorKey: c.key,
    name: c.label,
    kind: connectorKindLabel[c.kind],
    status: c.key === "manual_csv" ? ("MANUAL" as const) : ("NOT_CONNECTED" as const),
  })),
});

export async function createStore(
  principal: Principal,
  input: StoreProfileParsed,
  now: Date,
): Promise<StoreSummary> {
  const user = await prismaClient.user.findUniqueOrThrow({
    where: { id: principal.userId },
    select: { id: true, role: true, clientId: true },
  });
  if (user.role === "CLIENT" && user.clientId) {
    throw forbidden("Sua conta já está ligada a uma loja.");
  }
  const slug = await uniqueSlug(input.name);
  const store = await prismaClient.$transaction(async (tx) => {
    const created = await tx.client.create({
      data: { ...input, slug, onboardedAt: now },
      select: storeSelect,
    });
    await provisionStore(tx, created.id, provisionPlan());
    if (user.role === "CLIENT") {
      await tx.user.update({ where: { id: user.id }, data: { clientId: created.id } });
    }
    if (user.role === "CONSULTANT") {
      await tx.consultantAssignment.create({
        data: { consultantId: user.id, clientId: created.id },
      });
    }
    return created;
  });
  return { id: store.id, slug: store.slug, name: store.name, onboardedAt: now.toISOString() };
}

export async function storeOf(clientId: string): Promise<Store> {
  const row = await prismaClient.client.findUnique({
    where: { id: clientId },
    select: storeSelect,
  });
  if (!row) throw notFound("Loja não encontrada");
  return toStore(row);
}

export async function updateStore(clientId: string, input: StoreProfileParsed): Promise<Store> {
  const row = await prismaClient.client.update({
    where: { id: clientId },
    data: input,
    select: storeSelect,
  });
  return toStore(row);
}
