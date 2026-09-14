import type { Credentials } from "./connectorProvider.types";

export type MetaGraphConfig = {
  appId: string;
  appSecret: string;
  graphUrl: string;
  userAgent: string;
};

export type MetaCredentials = Credentials & { accessToken: string; expiresAt: string };

export type MetaTokenBody = { access_token?: string; expires_in?: number };

const DEFAULT_TOKEN_DAYS = 60;

export class MetaError extends Error {}

export const graphUrlOf = (config: MetaGraphConfig, path: string) =>
  new URL(`${config.graphUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`);

export async function graph<T>(config: MetaGraphConfig, url: URL | string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": config.userAgent },
  });
  const body = (await response.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!response.ok) {
    throw new MetaError(`Meta respondeu ${response.status}: ${body.error?.message ?? "erro"}`);
  }
  return body;
}

export function metaCredentialsOf(token: MetaTokenBody, now: Date): MetaCredentials {
  const seconds = token.expires_in ?? DEFAULT_TOKEN_DAYS * 24 * 60 * 60;
  return {
    accessToken: token.access_token ?? "",
    expiresAt: new Date(now.getTime() + seconds * 1000).toISOString(),
  };
}

export async function exchangeMetaCode(
  config: MetaGraphConfig,
  code: string,
  redirectUri: string,
): Promise<string> {
  const url = graphUrlOf(config, "oauth/access_token");
  url.searchParams.set("client_id", config.appId);
  url.searchParams.set("client_secret", config.appSecret);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("code", code);
  const short = await graph<MetaTokenBody>(config, url);
  if (!short.access_token) throw new MetaError("Meta não devolveu o token");
  return short.access_token;
}

export async function longLivedMetaToken(
  config: MetaGraphConfig,
  shortToken: string,
  now: Date,
): Promise<MetaCredentials> {
  const url = graphUrlOf(config, "oauth/access_token");
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", config.appId);
  url.searchParams.set("client_secret", config.appSecret);
  url.searchParams.set("fb_exchange_token", shortToken);
  const token = await graph<MetaTokenBody>(config, url);
  if (!token.access_token) throw new MetaError("Meta não devolveu o token de longa duração");
  return metaCredentialsOf(token, now);
}
