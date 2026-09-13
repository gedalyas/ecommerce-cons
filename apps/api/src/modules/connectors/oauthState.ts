import jwt from "jsonwebtoken";
import type { ConnectorKey } from "@ecommerce/contracts/connectors";

export const OAUTH_STATE_SECONDS = 10 * 60;

export type OAuthState = {
  clientId: string;
  userId: string;
  key: ConnectorKey;
  domain: string;
};

export function signOAuthState(state: OAuthState, secret: string): string {
  return jwt.sign({ ...state, purpose: "connector" }, secret, {
    algorithm: "HS256",
    expiresIn: OAUTH_STATE_SECONDS,
  });
}

export function verifyOAuthState(token: string, secret: string): OAuthState | null {
  try {
    const payload = jwt.verify(token, secret, { algorithms: ["HS256"] });
    if (typeof payload === "string" || payload["purpose"] !== "connector") return null;
    const { clientId, userId, key, domain } = payload as Partial<OAuthState>;
    if (!clientId || !userId || !key) return null;
    return { clientId, userId, key, domain: domain ?? "" };
  } catch {
    return null;
  }
}
