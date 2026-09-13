export const subscriptionStatuses = ["ACTIVE", "PAST_DUE", "CANCELED"] as const;
export type SubscriptionStatus = (typeof subscriptionStatuses)[number];

export const subscriptionStatusLabel: Record<SubscriptionStatus, string> = {
  ACTIVE: "Ativa",
  PAST_DUE: "Em atraso",
  CANCELED: "Encerrada",
};

export const subscriptionSources = ["GURU", "MANUAL"] as const;
export type SubscriptionSource = (typeof subscriptionSources)[number];

export const subscriptionSourceLabel: Record<SubscriptionSource, string> = {
  GURU: "Guru",
  MANUAL: "Liberação manual",
};

export const accessStates = ["ACTIVE", "PAST_DUE", "CANCELED", "NONE"] as const;
export type AccessState = (typeof accessStates)[number];

export const accessStateLabel: Record<AccessState, string> = {
  ACTIVE: "Ativa",
  PAST_DUE: "Em atraso",
  CANCELED: "Encerrada",
  NONE: "Sem assinatura",
};

export const contractStatuses = ["PENDING", "SIGNED", "REFUSED", "DELETED", "EXPIRED"] as const;
export type ContractStatus = (typeof contractStatuses)[number];

export const contractStatusLabel: Record<ContractStatus, string> = {
  PENDING: "Pendente",
  SIGNED: "Assinado",
  REFUSED: "Recusado",
  DELETED: "Excluído",
  EXPIRED: "Expirado",
};

export type SubscriptionSummary = {
  source: SubscriptionSource;
  status: SubscriptionStatus;
  planName: string | null;
  startedAt: string | null;
  currentPeriodEnd: string | null;
  canceledAt: string | null;
};

export type ContractSummary = {
  status: ContractStatus;
  signingUrl: string | null;
  signedAt: string | null;
  signedFileUrl: string | null;
};

export type BillingScreen = {
  subscription: SubscriptionSummary | null;
  contract: ContractSummary | null;
  checkoutUrl: string | null;
};
