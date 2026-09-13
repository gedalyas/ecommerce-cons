import type { Credentials } from "./connectorProvider.types";

export type GoogleConfig = {
  clientId: string;
  clientSecret: string;
  authUrl: string;
  tokenUrl: string;
  userAgent: string;
};

export type GoogleCredentials = Credentials & {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
};

export const GOOGLE_ADS_SCOPE = "https://www.googleapis.com/auth/adwords";
export const GA4_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const REFRESH_AHEAD_MS = 5 * 60 * 1000;

export class GoogleError extends Error {}

export function googleAuthorizeUrl(
  config: GoogleConfig,
  params: { state: string; redirectUri: string; scope: string },
): string {
  const url = new URL(config.authUrl);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", params.scope);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("state", params.state);
  return url.toString();
}

type TokenResponse = { access_token?: string; refresh_token?: string; expires_in?: number };

async function tokenRequest(config: GoogleConfig, body: Record<string, string>) {
  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "User-Agent": config.userAgent,
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      ...body,
    }).toString(),
  });
  if (!response.ok) throw new GoogleError(`Google recusou o token (${response.status})`);
  return (await response.json()) as TokenResponse;
}

const credentialsOf = (token: TokenResponse, previous: GoogleCredentials | null, now: Date) => ({
  accessToken: token.access_token ?? "",
  refreshToken: token.refresh_token ?? previous?.refreshToken ?? "",
  expiresAt: new Date(now.getTime() + (token.expires_in ?? 3600) * 1000).toISOString(),
});

export async function googleExchangeCode(
  config: GoogleConfig,
  code: string,
  redirectUri: string,
  now: Date,
): Promise<GoogleCredentials> {
  const token = await tokenRequest(config, {
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });
  if (!token.access_token || !token.refresh_token) {
    throw new GoogleError(
      "Google não devolveu o refresh token; autorize de novo com consentimento.",
    );
  }
  return credentialsOf(token, null, now);
}

export async function googleRefresh(
  config: GoogleConfig,
  stored: Credentials,
  now: Date,
): Promise<GoogleCredentials | null> {
  const credentials = stored as GoogleCredentials;
  if (new Date(credentials.expiresAt).getTime() - now.getTime() > REFRESH_AHEAD_MS) return null;
  const token = await tokenRequest(config, {
    grant_type: "refresh_token",
    refresh_token: credentials.refreshToken,
  });
  return credentialsOf(token, credentials, now);
}

export async function googleJson<T>(
  url: string,
  credentials: GoogleCredentials,
  init: { method?: string; headers?: Record<string, string>; body?: unknown; userAgent: string },
): Promise<T> {
  const response = await fetch(url, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${credentials.accessToken}`,
      Accept: "application/json",
      "User-Agent": init.userAgent,
      ...(init.body !== undefined ? { "content-type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
    ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
  });
  if (!response.ok) throw new GoogleError(`Google respondeu ${response.status} em ${url}`);
  return (await response.json()) as T;
}
