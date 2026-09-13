import { prismaClient } from "@/shared/dependencies/prismaClient";
import { PROTOTYPE_TODAY } from "@/shared/config/prototype";
import type { ConnectionsHealth, ConnectionsScreen, DataSourceState } from "./connections.types";
import { connectionsSummaryOf, hasErrorSource } from "./connectionsSummary";
import { syncLabelOf } from "./syncLabel";

async function clientIdFor(slug: string) {
  const client = await prismaClient.client.findUnique({ where: { slug }, select: { id: true } });
  if (!client) throw new Error(`Unknown client "${slug}"`);
  return client.id;
}

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

export async function connectionsScreen(clientSlug: string): Promise<ConnectionsScreen> {
  const sources = await dataSourcesFor(await clientIdFor(clientSlug));
  return { sources, summary: connectionsSummaryOf(sources) };
}

export async function connectionsHealth(clientSlug: string): Promise<ConnectionsHealth> {
  const sources = await dataSourcesFor(await clientIdFor(clientSlug));
  return { hasError: hasErrorSource(sources) };
}
