import type { ConnectorKey } from "../connectors/connectorCatalog";
import type { StoreConnector } from "../connectors/connectors.types";
export const dataSourceStatuses = ["CONNECTED", "ERROR", "NOT_CONNECTED", "MANUAL"] as const;
export type DataSourceStatus = (typeof dataSourceStatuses)[number];

export type DataSourceState = {
  connectorKey: ConnectorKey;
  name: string;
  kind: string;
  status: DataSourceStatus;
  syncLabel: string;
};

export type ConnectionsSummary = {
  total: number;
  active: number;
  error: number;
  notConnected: number;
};

export type ConnectionsScreen = {
  connectors: StoreConnector[];
  summary: ConnectionsSummary;
  canRequest: boolean;
};

export type ConnectionsHealth = { hasError: boolean };
