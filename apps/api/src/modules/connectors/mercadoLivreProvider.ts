import { keepsOrderFor, type ConnectorKey } from "@ecommerce/contracts/connectors";
import type {
  Authorized,
  ConnectorProvider,
  Credentials,
  ExchangeParams,
  SyncContext,
  SyncResult,
} from "./connectorProvider.types";
import {
  mercadoLivreFulfillmentOf,
  mercadoLivreOrderInputOf,
  type MercadoLivreOrder,
  type MercadoLivreShipment,
} from "./mercadoLivreOrders";

export type MercadoLivreConfig = {
  key: ConnectorKey;
  appId: string;
  clientSecret: string;
  authUrl: string;
  apiUrl: string;
  userAgent: string;
  backfillMonths: number;
};

type MercadoLivreCredentials = Credentials & {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  userId: string;
};

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user_id?: number | string;
};

const PAGE_SIZE = 50;
const MAX_PAGES = 200;
const CHUNK_DAYS = 90;
const OVERLAP_MS = 24 * 60 * 60 * 1000;
const REFRESH_AHEAD_MS = 10 * 60 * 1000;
const CURSOR = "orders";

class MercadoLivreError extends Error {}

const apiUrl = (config: MercadoLivreConfig, path: string) =>
  new URL(`${config.apiUrl.replace(/\/$/, "")}${path}`);

async function tokenRequest(
  config: MercadoLivreConfig,
  body: Record<string, string>,
  now: Date,
): Promise<MercadoLivreCredentials> {
  const response = await fetch(apiUrl(config, "/oauth/token"), {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "User-Agent": config.userAgent,
    },
    body: new URLSearchParams({
      client_id: config.appId,
      client_secret: config.clientSecret,
      ...body,
    }).toString(),
  });
  if (!response.ok)
    throw new MercadoLivreError(`Mercado Livre recusou o token (${response.status})`);
  const token = (await response.json()) as TokenResponse;
  if (!token.access_token || !token.refresh_token || token.user_id === undefined) {
    throw new MercadoLivreError("Mercado Livre não devolveu o token de acesso");
  }
  return {
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt: new Date(now.getTime() + (token.expires_in ?? 21600) * 1000).toISOString(),
    userId: String(token.user_id),
  };
}

async function apiGet<T>(
  config: MercadoLivreConfig,
  credentials: MercadoLivreCredentials,
  path: string,
  query: Record<string, string> = {},
): Promise<T | null> {
  const url = apiUrl(config, path);
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${credentials.accessToken}`,
      Accept: "application/json",
      "User-Agent": config.userAgent,
    },
  });
  if (response.status === 404) return null;
  if (!response.ok)
    throw new MercadoLivreError(`Mercado Livre respondeu ${response.status} em ${path}`);
  return (await response.json()) as T;
}

async function exchangeMercadoLivreCode(
  config: MercadoLivreConfig,
  { code, redirectUri }: ExchangeParams,
  now: Date,
): Promise<Authorized> {
  const credentials = await tokenRequest(
    config,
    { grant_type: "authorization_code", code, redirect_uri: redirectUri },
    now,
  );
  const me = await apiGet<{ nickname?: string }>(config, credentials, "/users/me");
  return {
    credentials,
    externalId: credentials.userId,
    externalLabel: me?.nickname?.trim() || `Vendedor ${credentials.userId}`,
  };
}

async function shipmentOf(
  config: MercadoLivreConfig,
  credentials: MercadoLivreCredentials,
  order: MercadoLivreOrder,
): Promise<MercadoLivreShipment | null> {
  const id = order.shipping?.id;
  if (id === null || id === undefined) return null;
  return apiGet<MercadoLivreShipment>(config, credentials, `/shipments/${id}`);
}

async function pullChunk(
  config: MercadoLivreConfig,
  context: SyncContext,
  from: string,
  to: string,
): Promise<{ written: number; latest: string }> {
  const credentials = context.credentials as MercadoLivreCredentials;
  let written = 0;
  let latest = from;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const body = await apiGet<{ results?: MercadoLivreOrder[] }>(
      config,
      credentials,
      "/orders/search",
      {
        seller: credentials.userId,
        "order.date_last_updated.from": from,
        "order.date_last_updated.to": to,
        sort: "date_asc",
        offset: String(page * PAGE_SIZE),
        limit: String(PAGE_SIZE),
      },
    );
    const orders = body?.results ?? [];
    if (orders.length === 0) break;
    const enriched: MercadoLivreOrder[] = [];
    for (const order of orders) {
      enriched.push({ ...order, shipment: await shipmentOf(config, credentials, order) });
    }
    const kept = enriched.filter((o) =>
      keepsOrderFor(config.key, mercadoLivreFulfillmentOf(o.shipment)),
    );
    await context.saveRaw(
      "order",
      kept.map((o) => ({ externalId: String(o.id), payload: o })),
    );
    written += await context.writeOrders(
      kept.map(mercadoLivreOrderInputOf).filter((o) => o !== null),
    );
    for (const o of enriched)
      if (o.last_updated && o.last_updated > latest) latest = o.last_updated;
    if (orders.length < PAGE_SIZE) break;
  }
  return { written, latest };
}

async function pullOrders(
  config: MercadoLivreConfig,
  context: SyncContext,
  since: Date,
): Promise<SyncResult> {
  let written = 0;
  let latest = since.toISOString();
  const chunkMs = CHUNK_DAYS * 24 * 60 * 60 * 1000;
  for (let start = since.getTime(); start < context.now.getTime(); start += chunkMs) {
    const end = Math.min(start + chunkMs, context.now.getTime());
    const chunk = await pullChunk(
      config,
      context,
      new Date(start).toISOString(),
      new Date(end).toISOString(),
    );
    written += chunk.written;
    if (chunk.latest > latest) latest = chunk.latest;
  }
  return { cursor: { ...context.cursor, [CURSOR]: latest }, written };
}

const monthsAgo = (now: Date, months: number) => {
  const d = new Date(now);
  d.setUTCMonth(d.getUTCMonth() - months);
  return d;
};

export function mercadoLivreProvider(config: MercadoLivreConfig): ConnectorProvider {
  return {
    key: config.key,
    authPattern: "oauth",
    authorizeUrl: ({ state, redirectUri }) => {
      const url = new URL(`${config.authUrl.replace(/\/$/, "")}/authorization`);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("client_id", config.appId);
      url.searchParams.set("redirect_uri", redirectUri);
      url.searchParams.set("state", state);
      return url.toString();
    },
    exchangeCode: (params) => exchangeMercadoLivreCode(config, params, new Date()),
    async refresh(credentials, now) {
      const current = credentials as MercadoLivreCredentials;
      if (new Date(current.expiresAt).getTime() - now.getTime() > REFRESH_AHEAD_MS) return null;
      return tokenRequest(
        config,
        { grant_type: "refresh_token", refresh_token: current.refreshToken },
        now,
      );
    },
    async test(credentials) {
      const me = await apiGet<{ nickname?: string }>(
        config,
        credentials as MercadoLivreCredentials,
        "/users/me",
      );
      if (!me) throw new Error("Mercado Livre não encontrou o vendedor");
      return { accountLabel: me.nickname?.trim() || "Mercado Livre" };
    },
    backfill: (context) =>
      pullOrders(config, context, monthsAgo(context.now, config.backfillMonths)),
    sync(context) {
      const last = context.cursor[CURSOR];
      const since = last ? new Date(new Date(last).getTime() - OVERLAP_MS) : context.now;
      return pullOrders(config, context, since);
    },
  };
}
