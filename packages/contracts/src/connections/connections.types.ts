import type { DataOwners } from "../connectors/dataSourceRules";
import type { ConnectorKey } from "../connectors/connectorCatalog";
import type { DataSourceStatus, StoreConnector } from "../connectors/connectors.types";

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
  owners: DataOwners;
};

export type ConnectionsHealth = { hasError: boolean };
