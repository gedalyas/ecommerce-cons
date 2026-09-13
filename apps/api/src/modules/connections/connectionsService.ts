import type {
  ConnectionsHealth,
  ConnectionsScreen,
  DataSourceState,
} from "@ecommerce/contracts/connections";
import { connectionsSummaryOf, hasErrorSource } from "@ecommerce/contracts/connections";
import {
  connectorCatalog,
  connectorKindLabel,
  type ConnectionRequest,
  type ConnectionRequestInput,
  type ConnectorKey,
  type StoreConnector,
} from "@ecommerce/contracts/connectors";
import { prismaClient } from "@ecommerce/database/client";
import { currentDay } from "@/shared/config/clock";
import type { AuthContext } from "@/shared/http/auth.types";
import { HttpError } from "@/shared/http/httpError";
import { syncLabelOf } from "./syncLabel";

const requestSelect = {
  id: true,
  connectorKey: true,
  status: true,
  note: true,
  createdAt: true,
  resolvedAt: true,
  requestedBy: { select: { name: true } },
} as const;

const toRequest = (r: {
  id: string;
  connectorKey: string;
  status: ConnectionRequest["status"];
  note: string;
  createdAt: Date;
  resolvedAt: Date | null;
  requestedBy: { name: string } | null;
}): ConnectionRequest => ({
  id: r.id,
  connectorKey: r.connectorKey as ConnectorKey,
  status: r.status,
  note: r.note,
  requestedBy: r.requestedBy?.name ?? "—",
  createdAt: r.createdAt.toISOString(),
  resolvedAt: r.resolvedAt?.toISOString() ?? null,
});

export async function dataSourcesFor(
  clientId: string,
  today: string = currentDay(),
): Promise<DataSourceState[]> {
  const rows = await prismaClient.dataSource.findMany({
    where: { clientId },
    orderBy: { position: "asc" },
    select: { connectorKey: true, name: true, kind: true, status: true, lastSyncedAt: true },
  });
  return rows.map((r) => ({
    connectorKey: r.connectorKey as ConnectorKey,
    name: r.name,
    kind: r.kind,
    status: r.status,
    syncLabel: syncLabelOf(r.status, r.lastSyncedAt, today),
  }));
}

export async function storeConnectorsFor(clientId: string): Promise<StoreConnector[]> {
  const [sources, requests] = await Promise.all([
    dataSourcesFor(clientId),
    prismaClient.connectionRequest.findMany({
      where: { clientId, status: { in: ["REQUESTED", "IN_PROGRESS"] } },
      orderBy: { createdAt: "desc" },
      select: requestSelect,
    }),
  ]);
  const byKey = new Map(sources.map((s) => [s.connectorKey, s]));
  const openRequest = new Map(requests.map((r) => [r.connectorKey, toRequest(r)]));
  return connectorCatalog.map((connector) => {
    const source = byKey.get(connector.key);
    return {
      ...connector,
      status: source?.status ?? "NOT_CONNECTED",
      syncLabel: source?.syncLabel ?? "—",
      request: openRequest.get(connector.key) ?? null,
    };
  });
}

export async function connectionsScreen(auth: AuthContext): Promise<ConnectionsScreen> {
  const connectors = await storeConnectorsFor(auth.clientId);
  return { connectors, summary: connectionsSummaryOf(connectors), canRequest: true };
}

export async function connectionsHealth(clientId: string): Promise<ConnectionsHealth> {
  const sources = await dataSourcesFor(clientId);
  return { hasError: hasErrorSource(sources) };
}

export async function requestConnection(
  auth: AuthContext,
  key: ConnectorKey,
  input: ConnectionRequestInput,
): Promise<ConnectionRequest> {
  const connector = connectorCatalog.find((c) => c.key === key);
  if (!connector || connector.availability === "manual") {
    throw new HttpError(422, "Este conector não precisa de solicitação.");
  }
  const open = await prismaClient.connectionRequest.findFirst({
    where: {
      clientId: auth.clientId,
      connectorKey: key,
      status: { in: ["REQUESTED", "IN_PROGRESS"] },
    },
    select: { id: true },
  });
  if (open) throw new HttpError(409, "Já existe uma solicitação em aberto para este conector.");
  await prismaClient.dataSource.upsert({
    where: { clientId_connectorKey: { clientId: auth.clientId, connectorKey: key } },
    create: {
      clientId: auth.clientId,
      connectorKey: key,
      name: connector.label,
      kind: connectorKindLabel[connector.kind],
      status: "NOT_CONNECTED",
      position: connectorCatalog.indexOf(connector),
    },
    update: {},
  });
  const row = await prismaClient.connectionRequest.create({
    data: {
      clientId: auth.clientId,
      connectorKey: key,
      note: input.note,
      requestedById: auth.userId,
    },
    select: requestSelect,
  });
  return toRequest(row);
}
