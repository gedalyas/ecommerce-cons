import { prismaClient } from "@ecommerce/database/client";
import { PROTOTYPE_TODAY } from "@ecommerce/contracts/shared/clock";
import type {
  ConnectionsHealth,
  ConnectionsScreen,
  DataSourceState,
} from "@ecommerce/contracts/connections";
import { connectionsSummaryOf, hasErrorSource } from "@ecommerce/contracts/connections";
import { syncLabelOf } from "./syncLabel";

export async function dataSourcesFor(
  clientId: string,
  today: string = PROTOTYPE_TODAY,
): Promise<DataSourceState[]> {
  const rows = await prismaClient.dataSource.findMany({
    where: { clientId },
    orderBy: { position: "asc" },
    select: { name: true, kind: true, status: true, lastSyncedAt: true },
  });
  return rows.map((r) => ({
    name: r.name,
    kind: r.kind,
    status: r.status,
    syncLabel: syncLabelOf(r.status, r.lastSyncedAt, today),
  }));
}

export async function connectionsScreen(clientId: string): Promise<ConnectionsScreen> {
  const sources = await dataSourcesFor(clientId);
  return { sources, summary: connectionsSummaryOf(sources) };
}

export async function connectionsHealth(clientId: string): Promise<ConnectionsHealth> {
  const sources = await dataSourcesFor(clientId);
  return { hasError: hasErrorSource(sources) };
}
