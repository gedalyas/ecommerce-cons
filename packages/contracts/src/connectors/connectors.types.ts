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

export const connectionStages = [
  "AUTHORIZED",
  "IMPORTING",
  "PROCESSING",
  "READY",
  "ERROR",
] as const;
export type ConnectionStage = (typeof connectionStages)[number];

export const connectionStageLabel: Record<ConnectionStage, string> = {
  AUTHORIZED: "Fonte autorizada",
  IMPORTING: "Importando dados",
  PROCESSING: "Processando análises",
  READY: "Pronto para usar",
  ERROR: "Erro na sincronização",
};

export const connectionStageHint: Record<ConnectionStage, string> = {
  AUTHORIZED: "O acesso à plataforma foi autorizado.",
  IMPORTING: "O histórico da loja está sendo importado.",
  PROCESSING: "As tabelas de análise estão sendo preparadas.",
  READY: "Os painéis já usam os dados desta conexão.",
  ERROR: "A última sincronização falhou; tente de novo ou reconecte.",
};

export type ConnectionSummary = {
  stage: ConnectionStage;
  externalLabel: string;
  lastSyncAt: string | null;
  lastError: string | null;
};

export type StoreConnector = Connector & {
  status: DataSourceStatus;
  syncLabel: string;
  request: ConnectionRequest | null;
  connection: ConnectionSummary | null;
};

export const statusMappingTargets = ["PAID", "PENDING", "CANCELLED", "REFUNDED", "IGNORE"] as const;
export type StatusMappingTarget = (typeof statusMappingTargets)[number];

export const statusMappingTargetLabel: Record<StatusMappingTarget, string> = {
  PAID: "Pago",
  PENDING: "Pendente",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
  IGNORE: "Ignorar",
};

export type ConnectorStatusOption = { id: string; label: string };

export type ConnectorAccountOption = { id: string; label: string };

export type ConnectorSettings = {
  statuses: ConnectorStatusOption[];
  statusMap: Record<string, StatusMappingTarget>;
  accounts: ConnectorAccountOption[];
  accountId: string | null;
};

export type DataReadiness = {
  hasSource: boolean;
  connectedKeys: ConnectorKey[];
};
