import { connectorOf, familyOf, type ConnectorKey } from "@ecommerce/contracts/connectors";
import { Prisma, prismaClient } from "@ecommerce/database/client";
import type { ConnectionAuthPattern } from "@ecommerce/database/enums";

export const withAccount = {
  account: { select: { id: true, credentials: true, externalId: true, externalLabel: true } },
} as const;

export function connectionOfKey(clientId: string, key: ConnectorKey) {
  return prismaClient.connection.findFirst({
    where: { clientId, connectorKey: key },
    orderBy: { createdAt: "asc" },
    include: withAccount,
  });
}

export function upsertAccount(input: {
  clientId: string;
  key: ConnectorKey;
  authPattern: ConnectionAuthPattern;
  externalId: string;
  externalLabel: string;
  sealedCredentials: string;
  userId: string;
}): Promise<{ id: string }> {
  const family = familyOf(input.key);
  const data = {
    authPattern: input.authPattern,
    externalLabel: input.externalLabel,
    credentials: input.sealedCredentials,
    authorizedBy: input.userId,
  };
  return prismaClient.connectorAccount.upsert({
    where: {
      clientId_family_externalId: {
        clientId: input.clientId,
        family,
        externalId: input.externalId,
      },
    },
    create: { clientId: input.clientId, family, externalId: input.externalId, ...data },
    update: data,
    select: { id: true },
  });
}

export async function dropIfOrphan(clientId: string, accountId: string | null): Promise<void> {
  if (!accountId) return;
  await prismaClient.connectorAccount.deleteMany({
    where: { id: accountId, clientId, connections: { none: {} } },
  });
}

export async function saveRefreshed(
  accountId: string,
  read: string,
  sealed: string,
): Promise<boolean> {
  const { count } = await prismaClient.connectorAccount.updateMany({
    where: { id: accountId, credentials: read },
    data: { credentials: sealed },
  });
  return count === 1;
}

export async function latestCredentials(accountId: string): Promise<string | null> {
  const account = await prismaClient.connectorAccount.findUnique({
    where: { id: accountId },
    select: { credentials: true },
  });
  return account?.credentials ?? null;
}

export function saveIntegration(input: {
  existing: { id: string; accountId: string } | null;
  clientId: string;
  key: ConnectorKey;
  accountId: string;
  userId: string;
  settings: Record<string, unknown> | null;
}): Promise<{ id: string }> {
  const data = {
    accountId: input.accountId,
    stage: "AUTHORIZED" as const,
    lastError: null,
    authorizedBy: input.userId,
    ...(input.settings ? { settings: input.settings as Prisma.InputJsonObject } : {}),
  };
  if (input.existing) {
    const switched = input.existing.accountId !== input.accountId;
    return prismaClient.connection.update({
      where: { id: input.existing.id },
      data: switched ? { ...data, syncCursor: Prisma.DbNull, lastSyncAt: null } : data,
      select: { id: true },
    });
  }
  return prismaClient.connection.create({
    data: {
      clientId: input.clientId,
      connectorKey: input.key,
      name: connectorOf(input.key).label,
      ...data,
    },
    select: { id: true },
  });
}
