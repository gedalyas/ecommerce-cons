import type { AccessResult } from "@ecommerce/contracts/connectors";

export const REFUSED_MESSAGE = "A plataforma recusou o acesso com a autorização salva.";

export function credentialsExpired(credentials: Record<string, unknown>, now: Date): boolean {
  const expiresAt = credentials["expiresAt"];
  return typeof expiresAt === "string" && Date.parse(expiresAt) <= now.getTime();
}

export const isNetworkFailure = (error: unknown): boolean =>
  error instanceof TypeError && "cause" in error && error.cause !== undefined;

export const failedAccess = (error: unknown): AccessResult =>
  isNetworkFailure(error)
    ? { status: "unreachable" }
    : { status: "refused", message: REFUSED_MESSAGE };
