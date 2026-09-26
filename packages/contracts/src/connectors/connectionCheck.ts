import type { ConnectorAccountOption } from "./connectors.types";

export const receivedKinds = [
  "order",
  "product",
  "customer",
  "ad_insight",
  "traffic",
  "social",
] as const;
export type ReceivedKind = (typeof receivedKinds)[number];

export const receivedKindLabel: Record<ReceivedKind, string> = {
  order: "Pedidos",
  product: "Produtos",
  customer: "Clientes",
  ad_insight: "Linhas de anúncios",
  traffic: "Linhas de tráfego",
  social: "Linhas de redes sociais",
};

export type AccessResult =
  | { status: "ok"; accountLabel: string }
  | { status: "refused"; message: string }
  | { status: "unreachable" }
  | { status: "unverified" };

export type ReceivedRows = { kind: ReceivedKind; label: string; rows: number };

export type CheckVerdict = { tone: "ok" | "warning" | "error"; text: string };

export type ConnectionCheck = {
  access: AccessResult;
  received: ReceivedRows[];
  lastSyncAt: string | null;
  verdict: CheckVerdict;
};

export const CHECK_WINDOW_DAYS = 7;

export function accountCheck(
  accounts: readonly ConnectorAccountOption[],
  accountId: string | null,
  fallbackLabel: string,
): AccessResult {
  const chosen = accountId ? accounts.find((a) => a.id === accountId) : undefined;
  if (accountId && accounts.length > 0 && !chosen) {
    return {
      status: "refused",
      message:
        "A conta escolhida não aparece mais para este acesso. Escolha outra nas configurações.",
    };
  }
  return { status: "ok", accountLabel: chosen?.label ?? fallbackLabel };
}

export function connectionVerdict(
  access: AccessResult,
  received: readonly ReceivedRows[],
): CheckVerdict {
  if (access.status === "refused") {
    return { tone: "error", text: "Acesso recusado — reconecte a integração." };
  }
  if (access.status === "unreachable") {
    return {
      tone: "warning",
      text: "A plataforma não respondeu agora — tente de novo em alguns minutos.",
    };
  }
  const rows = received.reduce((s, r) => s + r.rows, 0);
  if (rows > 0) return { tone: "ok", text: "Tudo certo — os dados estão chegando." };
  return {
    tone: "warning",
    text: `Conectado, mas nenhum dado chegou nos últimos ${CHECK_WINDOW_DAYS} dias.`,
  };
}
