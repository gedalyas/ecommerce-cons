import type { UserRole } from "../auth/auth.types";

export const auditActions = [
  "USER_REGISTERED",
  "USER_IMPERSONATED",
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
  "STORE_SCREENS_RELEASED",
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
  "SUBSCRIPTION_ACTIVATED",
  "SUBSCRIPTION_PAST_DUE",
  "SUBSCRIPTION_CANCELED",
  "ACCESS_GRANTED",
  "ACCESS_REVOKED",
  "CONTRACT_CREATED",
  "CONTRACT_SIGNED",
  "CONTRACT_REFUSED",
  "CONTRACT_RESENT",
  "CONNECTION_AUTHORIZED",
  "CONNECTION_REMOVED",
  "CONNECTION_SYNCED",
  "CONNECTION_FAILED",
  "CONNECTION_TESTED",
  "DATA_SOURCE_CHANGED",
  "TEAM_MEMBER_INVITED",
  "TEAM_INVITATION_REVOKED",
  "TEAM_MEMBER_UPDATED",
  "TEAM_MEMBER_REMOVED",
  "CAMPAIGN_TAGGED",
] as const;
export type AuditAction = (typeof auditActions)[number];

export const auditActionLabel: Record<AuditAction, string> = {
  USER_REGISTERED: "Conta criada",
  USER_IMPERSONATED: "Acesso como usuário",
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
  STORE_SCREENS_RELEASED: "Telas liberadas",
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
  SUBSCRIPTION_ACTIVATED: "Assinatura ativada",
  SUBSCRIPTION_PAST_DUE: "Assinatura em atraso",
  SUBSCRIPTION_CANCELED: "Assinatura encerrada",
  ACCESS_GRANTED: "Acesso liberado",
  ACCESS_REVOKED: "Acesso encerrado",
  CONTRACT_CREATED: "Contrato enviado",
  CONTRACT_SIGNED: "Contrato assinado",
  CONTRACT_REFUSED: "Contrato recusado",
  CONTRACT_RESENT: "Contrato reenviado",
  CONNECTION_AUTHORIZED: "Conexão autorizada",
  CONNECTION_REMOVED: "Conexão removida",
  CONNECTION_SYNCED: "Sincronização concluída",
  CONNECTION_FAILED: "Sincronização falhou",
  CONNECTION_TESTED: "Conexão testada",
  DATA_SOURCE_CHANGED: "Fonte de dados trocada",
  TEAM_MEMBER_INVITED: "Membro convidado",
  TEAM_INVITATION_REVOKED: "Convite de equipe revogado",
  TEAM_MEMBER_UPDATED: "Acesso do membro alterado",
  TEAM_MEMBER_REMOVED: "Membro removido",
  CAMPAIGN_TAGGED: "Campanha marcada",
};

export type ActivityEntry = {
  id: string;
  storeId: string | null;
  storeName: string | null;
  actorName: string;
  actorRole: UserRole | null;
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
