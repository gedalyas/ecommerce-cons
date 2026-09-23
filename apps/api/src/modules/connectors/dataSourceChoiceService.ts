import { Prisma, prismaClient } from "@ecommerce/database/client";
import {
  choiceProblem,
  choiceSince,
  connectorOf,
  dataKindLabel,
  type DataSourceChoice,
} from "@ecommerce/contracts/connectors";
import { formatDate } from "@ecommerce/contracts/shared/format";
import { recordActivity } from "@/modules/audit/contract";
import { ownerOf, sinceOf } from "@/modules/connections/contract";
import { refreshCustomers } from "@/modules/customers/contract";
import type { AuthContext } from "@/shared/http/auth.types";
import { HttpError } from "@/shared/http/httpError";

const dayOf = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

async function isConnected(clientId: string, key: DataSourceChoice["source"]): Promise<boolean> {
  if (key == null) return false;
  const healthy = await prismaClient.connection.count({
    where: { clientId, connectorKey: key, stage: { in: ["IMPORTING", "PROCESSING", "READY"] } },
  });
  return healthy > 0;
}

export async function chooseDataSource(
  auth: AuthContext,
  choice: DataSourceChoice,
  today: string,
): Promise<void> {
  const { clientId } = auth;
  const problem = choiceProblem(
    choice.kind,
    choice.source,
    await isConnected(clientId, choice.source),
  );
  if (problem) throw new HttpError(422, problem);
  const previous = await ownerOf(clientId, choice.kind);
  const source = choice.source ?? "system";
  if (previous === source) return;
  const since = choiceSince(previous, await sinceOf(clientId, choice.kind), today);
  const switchesSales = choice.kind === "sales" && previous != null;
  await prismaClient.$transaction(async (tx) => {
    await tx.storeDataSource.upsert({
      where: { clientId_kind: { clientId, kind: choice.kind } },
      create: { clientId, kind: choice.kind, source, since: since ? dayOf(since) : null },
      update: { source, since: since ? dayOf(since) : null },
    });
    if (!switchesSales) return;
    await tx.order.deleteMany({
      where: { clientId, source: previous, placedAt: { gte: dayOf(today) } },
    });
    await tx.connection.updateMany({
      where: { clientId, connectorKey: source },
      data: { syncCursor: Prisma.DbNull },
    });
  });
  if (switchesSales) await refreshCustomers(clientId);
  await recordActivity(auth, clientId, {
    action: "DATA_SOURCE_CHANGED",
    kind: dataKindLabel[choice.kind],
    source: choice.source ? connectorOf(choice.source).label : null,
    since: since
      ? formatDate(`${since}T00:00:00`, { day: "2-digit", month: "2-digit", year: "numeric" })
      : null,
  });
}
