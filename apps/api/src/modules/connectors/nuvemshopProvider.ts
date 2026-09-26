import type {
  ConnectorProvider,
  Credentials,
  SyncContext,
  SyncResult,
} from "./connectorProvider.types";
import { latestUpdatedAt, orderInputOf, type NuvemshopOrder } from "./nuvemshopOrders";

export type NuvemshopConfig = {
  appId: string;
  clientSecret: string;
  authUrl: string;
  apiUrl: string;
  userAgent: string;
  backfillMonths: number;
};

type NuvemshopCredentials = Credentials & { accessToken: string; storeId: string };

const PAGE_SIZE = 200;
const MAX_PAGES = 500;
const OVERLAP_MS = 24 * 60 * 60 * 1000;
const ORDERS_CURSOR = "orders";

class NuvemshopError extends Error {}

async function nuvemshopFetch<T>(
  config: NuvemshopConfig,
  credentials: NuvemshopCredentials,
  path: string,
  query: Record<string, string>,
): Promise<{ body: T; status: number }> {
  const url = new URL(`${config.apiUrl.replace(/\/$/, "")}/${credentials.storeId}${path}`);
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  const response = await fetch(url, {
    headers: {
      Authentication: `bearer ${credentials.accessToken}`,
      Authorization: `bearer ${credentials.accessToken}`,
      "User-Agent": config.userAgent,
      Accept: "application/json",
    },
  });
  if (response.status === 404) return { body: [] as T, status: 404 };
  if (!response.ok) {
    throw new NuvemshopError(`Nuvemshop respondeu ${response.status} em ${path}`);
  }
  return { body: (await response.json()) as T, status: response.status };
}

async function pullOrders(
  config: NuvemshopConfig,
  context: SyncContext,
  updatedAtMin: string,
): Promise<SyncResult> {
  const credentials = context.credentials as NuvemshopCredentials;
  let cursor = updatedAtMin;
  let written = 0;
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const { body } = await nuvemshopFetch<NuvemshopOrder[]>(config, credentials, "/orders", {
      updated_at_min: updatedAtMin,
      per_page: String(PAGE_SIZE),
      page: String(page),
    });
    const orders = Array.isArray(body) ? body : [];
    if (orders.length === 0) break;
    await context.saveRaw(
      "order",
      orders.map((o) => ({ externalId: String(o.id), payload: o })),
    );
    const inputs = orders.map(orderInputOf).filter((o) => o !== null);
    written += await context.writeOrders(inputs);
    cursor = latestUpdatedAt(orders, cursor);
    if (orders.length < PAGE_SIZE) break;
  }
  return { cursor: { ...context.cursor, [ORDERS_CURSOR]: cursor }, written };
}

const monthsAgo = (now: Date, months: number) => {
  const d = new Date(now);
  d.setUTCMonth(d.getUTCMonth() - months);
  return d.toISOString();
};

export function nuvemshopProvider(config: NuvemshopConfig): ConnectorProvider {
  return {
    key: "nuvemshop",
    authPattern: "domain_oauth",
    authorizeUrl: ({ state }) =>
      `${config.authUrl.replace(/\/$/, "")}/apps/${config.appId}/authorize?state=${encodeURIComponent(state)}`,
    async exchangeCode({ code, domain }) {
      const response = await fetch(`${config.authUrl.replace(/\/$/, "")}/apps/authorize/token`, {
        method: "POST",
        headers: { "content-type": "application/json", "User-Agent": config.userAgent },
        body: JSON.stringify({
          client_id: config.appId,
          client_secret: config.clientSecret,
          grant_type: "authorization_code",
          code,
        }),
      });
      if (!response.ok) throw new NuvemshopError(`Nuvemshop recusou o código (${response.status})`);
      const token = (await response.json()) as { access_token?: string; user_id?: number | string };
      if (!token.access_token || token.user_id === undefined) {
        throw new NuvemshopError("Nuvemshop não devolveu o token da loja");
      }
      return {
        credentials: { accessToken: token.access_token, storeId: String(token.user_id) },
        externalId: String(token.user_id),
        externalLabel: domain || `loja ${token.user_id}`,
      };
    },
    async test(credentials) {
      const store = credentials as NuvemshopCredentials;
      await nuvemshopFetch(config, store, "/store", {});
      return { accountLabel: `loja ${store.storeId}` };
    },
    backfill: (context) =>
      pullOrders(config, context, monthsAgo(context.now, config.backfillMonths)),
    sync(context) {
      const last = context.cursor[ORDERS_CURSOR];
      const since = last ? new Date(new Date(last).getTime() - OVERLAP_MS) : context.now;
      return pullOrders(config, context, since.toISOString());
    },
  };
}
