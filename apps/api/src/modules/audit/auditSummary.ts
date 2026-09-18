import { userRoleLabel } from "@ecommerce/contracts/auth";
import type { AuditDetail } from "./audit.types";
import { commercialSummary, type CommercialDetail } from "./commercialSummary";

const TEXT_LIMIT = 80;

const quote = (text: string) =>
  `"${text.length > TEXT_LIMIT ? `${text.slice(0, TEXT_LIMIT - 3)}…` : text}"`;

const invitationVerb: Record<
  "INVITATION_CREATED" | "INVITATION_RESENT" | "INVITATION_REVOKED",
  string
> = {
  INVITATION_CREATED: "Convidou",
  INVITATION_RESENT: "Reenviou o convite de",
  INVITATION_REVOKED: "Revogou o convite de",
};

const recommendationVerb: Record<
  | "RECOMMENDATION_CREATED"
  | "RECOMMENDATION_UPDATED"
  | "RECOMMENDATION_DONE"
  | "RECOMMENDATION_REOPENED"
  | "RECOMMENDATION_DELETED",
  string
> = {
  RECOMMENDATION_CREATED: "Criou",
  RECOMMENDATION_UPDATED: "Editou",
  RECOMMENDATION_DONE: "Concluiu",
  RECOMMENDATION_REOPENED: "Reabriu",
  RECOMMENDATION_DELETED: "Excluiu",
};

export function auditSummary(detail: AuditDetail): string {
  switch (detail.action) {
    case "USER_REGISTERED":
      return `Criou a conta ${detail.email}`;
    case "USER_IMPERSONATED":
      return `Acessou o sistema como ${detail.name} (${detail.email})`;
    case "INVITATION_CREATED":
    case "INVITATION_RESENT":
    case "INVITATION_REVOKED": {
      const where = detail.storeName ? ` para ${detail.storeName}` : "";
      const role = userRoleLabel[detail.role].toLowerCase();
      return `${invitationVerb[detail.action]} ${detail.email} como ${role}${where}`;
    }
    case "CONSULTANTS_ASSIGNED":
      return detail.names.length > 0
        ? `Definiu os consultores: ${detail.names.join(", ")}`
        : "Removeu todos os consultores da loja";
    case "TEAM_MEMBER_INVITED":
      return `Convidou ${detail.email} para a equipe (${detail.areas.join(", ")})`;
    case "TEAM_INVITATION_REVOKED":
      return `Revogou o convite de equipe de ${detail.email}`;
    case "TEAM_MEMBER_UPDATED":
      return `Alterou o acesso de ${detail.name} (${detail.areas.join(", ")})`;
    case "TEAM_MEMBER_REMOVED":
      return `Removeu ${detail.name} da equipe`;
    case "CONNECTION_REQUESTED":
      return `Solicitou a conexão ${detail.connector}`;
    case "CONNECTION_REQUEST_RESOLVED":
      return `Marcou a solicitação de ${detail.connector} como ${detail.status.toLowerCase()}`;
    case "STORE_CREATED":
      return `Criou a loja ${detail.storeName}`;
    case "STORE_UPDATED":
      return `Atualizou o perfil da loja ${detail.storeName}`;
    case "STORE_ARCHIVED":
      return `Arquivou a loja ${detail.storeName}`;
    case "STORE_RESTORED":
      return `Reativou a loja ${detail.storeName}`;
    case "IMPORT_RUN":
      return `Importou ${detail.kind.toLowerCase()} (${detail.fileName}): ${detail.imported} de ${detail.total} linhas`;
    case "IMPORT_UNDONE":
      return `Desfez a importação de ${detail.kind.toLowerCase()} (${detail.fileName})`;
    case "PILLAR_UPDATED":
      return `Atualizou o pilar ${detail.pillar}: ${detail.status.toLowerCase()}`;
    case "MANUAL_KPI_SET":
      return `Informou ${detail.kpi} em ${detail.pillar}: ${detail.value}`;
    case "RECOMMENDATION_CREATED":
    case "RECOMMENDATION_UPDATED":
    case "RECOMMENDATION_DONE":
    case "RECOMMENDATION_REOPENED":
    case "RECOMMENDATION_DELETED":
      return `${recommendationVerb[detail.action]} a recomendação ${quote(detail.text)}`;
    case "MILESTONE_UPDATED":
      return `Atualizou o critério ${detail.criterion}: ${detail.progress}%${detail.achieved ? ", atingido" : ""}`;
    default:
      return commercialSummary(detail as CommercialDetail);
  }
}
