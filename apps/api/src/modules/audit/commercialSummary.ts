import type { AuditDetail } from "./audit.types";

export type CommercialDetail = Extract<
  AuditDetail,
  {
    action:
      | "SUBSCRIPTION_ACTIVATED"
      | "SUBSCRIPTION_PAST_DUE"
      | "SUBSCRIPTION_CANCELED"
      | "ACCESS_GRANTED"
      | "ACCESS_REVOKED"
      | "CONTRACT_CREATED"
      | "CONTRACT_SIGNED"
      | "CONTRACT_REFUSED"
      | "CONTRACT_RESENT";
  }
>;

export function commercialSummary(detail: CommercialDetail): string {
  switch (detail.action) {
    case "SUBSCRIPTION_ACTIVATED":
      return `Assinatura de ${detail.email} ativada${detail.plan ? ` (${detail.plan})` : ""}`;
    case "SUBSCRIPTION_PAST_DUE":
      return `Assinatura de ${detail.email} em atraso`;
    case "SUBSCRIPTION_CANCELED":
      return `Assinatura de ${detail.email} encerrada`;
    case "ACCESS_GRANTED":
      return `Liberou o acesso da loja ${detail.storeName} sem venda`;
    case "ACCESS_REVOKED":
      return `Encerrou o acesso da loja ${detail.storeName}`;
    case "CONTRACT_CREATED":
      return `Enviou o contrato para assinatura de ${detail.signerEmail}`;
    case "CONTRACT_SIGNED":
      return `Contrato assinado por ${detail.signerEmail}`;
    case "CONTRACT_REFUSED":
      return `Contrato recusado por ${detail.signerEmail}`;
    case "CONTRACT_RESENT":
      return `Reenviou o contrato para ${detail.signerEmail}`;
  }
}
