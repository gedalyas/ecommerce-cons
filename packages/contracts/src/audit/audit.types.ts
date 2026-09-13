import type { UserRole } from "../auth/auth.types";

export const auditActions = [
  "USER_REGISTERED",
  "INVITATION_CREATED",
  "INVITATION_RESENT",
  "INVITATION_REVOKED",
  "CONSULTANTS_ASSIGNED",
  "CONNECTION_REQUESTED",
  "CONNECTION_REQUEST_RESOLVED",
  "STORE_CREATED",
  "STORE_UPDATED",
  "STORE_ARCHIVED",
  "STORE_RESTORED",
  "IMPORT_RUN",
  "IMPORT_UNDONE",
  "PILLAR_UPDATED",
  "MANUAL_KPI_SET",
  "RECOMMENDATION_CREATED",
  "RECOMMENDATION_UPDATED",
  "RECOMMENDATION_DONE",
  "RECOMMENDATION_REOPENED",
  "RECOMMENDATION_DELETED",
  "MILESTONE_UPDATED",
] as const;
export type AuditAction = (typeof auditActions)[number];

export const auditActionLabel: Record<AuditAction, string> = {
  USER_REGISTERED: "Conta criada",
  INVITATION_CREATED: "Convite enviado",
  INVITATION_RESENT: "Convite reenviado",
  INVITATION_REVOKED: "Convite revogado",
  CONSULTANTS_ASSIGNED: "Consultores atribuídos",
  CONNECTION_REQUESTED: "Conexão solicitada",
  CONNECTION_REQUEST_RESOLVED: "Solicitação de conexão atualizada",
  STORE_CREATED: "Loja criada",
  STORE_UPDATED: "Loja atualizada",
  STORE_ARCHIVED: "Loja arquivada",
  STORE_RESTORED: "Loja reativada",
  IMPORT_RUN: "Importação",
  IMPORT_UNDONE: "Importação desfeita",
  PILLAR_UPDATED: "Pilar atualizado",
  MANUAL_KPI_SET: "Indicador informado",
  RECOMMENDATION_CREATED: "Recomendação criada",
  RECOMMENDATION_UPDATED: "Recomendação editada",
  RECOMMENDATION_DONE: "Recomendação concluída",
  RECOMMENDATION_REOPENED: "Recomendação reaberta",
  RECOMMENDATION_DELETED: "Recomendação excluída",
  MILESTONE_UPDATED: "Marco atualizado",
};

export type ActivityEntry = {
  id: string;
  storeId: string | null;
  storeName: string | null;
  actorName: string;
  actorRole: UserRole;
  action: AuditAction;
  summary: string;
  createdAt: string;
};

export type ActivityPage = {
  entries: ActivityEntry[];
  page: number;
  pageSize: number;
  total: number;
};
