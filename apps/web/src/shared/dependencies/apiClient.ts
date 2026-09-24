import { isRedirect, redirect } from "@tanstack/react-router";
import type { AuthTokens } from "@ecommerce/contracts/auth";
import type { ApiError } from "@ecommerce/contracts/shared/apiError";
import { toQueryString, type QueryObject } from "@/shared/utils/queryString";
import { appSession } from "./session";

export class ApiRequestError extends Error {
  readonly status: number;
  readonly body: ApiError;

  constructor(status: number, body: ApiError) {
    super(body.message);
    this.status = status;
    this.body = body;
  }
}

export type ApiRequest = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  query?: QueryObject;
  body?: unknown;
  auth?: boolean;
};

const LOGIN_PATH = "/entrar";

function baseUrl() {
  const url = process.env["API_URL"];
  if (!url) throw new Error("API_URL is not set");
  return `${url.replace(/\/$/, "")}/api/v1`;
}

function bodyOf(body: unknown): { headers: Record<string, string>; body: BodyInit | null } {
  if (body === undefined) return { headers: {}, body: null };
  if (body instanceof FormData) return { headers: {}, body };
  return { headers: { "content-type": "application/json" }, body: JSON.stringify(body) };
}

type Credentials = { token: string; clientId: string | null } | null;

async function send(path: string, init: ApiRequest, credentials: Credentials) {
  const encoded = bodyOf(init.body);
  const headers: Record<string, string> = { accept: "application/json", ...encoded.headers };
  if (credentials) {
    headers["authorization"] = `Bearer ${credentials.token}`;
    if (credentials.clientId) headers["x-client-id"] = credentials.clientId;
  }
  const response = await fetch(`${baseUrl()}${path}${toQueryString(init.query)}`, {
    method: init.method ?? "GET",
    headers,
    body: encoded.body,
  });
  const text = await response.text();
  const body: unknown = text ? JSON.parse(text) : undefined;
  return { status: response.status, ok: response.ok, body };
}

async function refreshedToken(): Promise<string | null> {
  const session = await appSession();
  const refreshToken = session.data.refreshToken;
  if (!refreshToken) return null;
  const result = await send("/auth/refresh", { method: "POST", body: { refreshToken } }, null);
  if (!result.ok) {
    await session.clear();
    return null;
  }
  const { tokens } = result.body as { tokens: AuthTokens };
  await session.update({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
  return tokens.accessToken;
}

export async function apiFetch<T>(path: string, init: ApiRequest = {}): Promise<T> {
  const auth = init.auth ?? true;
  let credentials: Credentials = null;
  if (auth) {
    const session = await appSession();
    const token = session.data.accessToken ?? null;
    if (!token) throw redirect({ to: LOGIN_PATH });
    credentials = { token, clientId: session.data.activeClientId ?? null };
  }
  let result = await send(path, init, credentials);
  if (auth && credentials && result.status === 401) {
    const fresh = await refreshedToken();
    if (!fresh) throw redirect({ to: LOGIN_PATH });
    result = await send(path, init, { ...credentials, token: fresh });
  }
  if (!result.ok) {
    const body = (result.body ?? { message: "Falha na requisição" }) as ApiError;
    throw new ApiRequestError(result.status, body);
  }
  return result.body as T;
}

export type WriteResult = { ok: true } | { ok: false; message: string };

export async function attemptWrite(
  run: () => Promise<unknown>,
  fallback: string,
): Promise<WriteResult> {
  try {
    await run();
    return { ok: true };
  } catch (error) {
    if (isRedirect(error)) throw error;
    if (error instanceof ApiRequestError && error.status < 500) {
      const message: unknown = error.body?.message;
      return { ok: false, message: typeof message === "string" ? message : fallback };
    }
    console.error(error);
    return { ok: false, message: fallback };
  }
}
