import type { Connector, ConnectorKey } from "./connectorCatalog";

export const dataSourceStatuses = ["CONNECTED", "ERROR", "NOT_CONNECTED", "MANUAL"] as const;
export type DataSourceStatus = (typeof dataSourceStatuses)[number];

export const connectionRequestStatuses = ["REQUESTED", "IN_PROGRESS", "DONE", "DECLINED"] as const;
export type ConnectionRequestStatus = (typeof connectionRequestStatuses)[number];

export const connectionRequestStatusLabel: Record<ConnectionRequestStatus, string> = {
  REQUESTED: "Solicitada",
  IN_PROGRESS: "Em andamento",
  DONE: "Concluída",
  DECLINED: "Recusada",
};

export type ConnectionRequest = {
  id: string;
  connectorKey: ConnectorKey;
  status: ConnectionRequestStatus;
  note: string;
  requestedBy: string;
  createdAt: string;
  resolvedAt: string | null;
};

export type StoreConnector = Connector & {
  status: DataSourceStatus;
  syncLabel: string;
  request: ConnectionRequest | null;
};
