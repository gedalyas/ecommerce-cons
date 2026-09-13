import type { DataSourceStatus } from "@ecommerce/database/enums";

export type DataSourceState = {
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

export type ConnectionsScreen = { sources: DataSourceState[]; summary: ConnectionsSummary };

export type ConnectionsHealth = { hasError: boolean };
