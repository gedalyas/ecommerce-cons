import { keepsOrderFor, type ConnectorKey } from "@ecommerce/contracts/connectors";
import {
  amazonFulfillmentOf,
  amazonOrderInputOf,
  type AmazonOrder,
  type AmazonOrderItem,
} from "./amazonOrders";
import type {
  Authorized,
  ConnectorProvider,
  Credentials,
  ExchangeParams,
  SyncContext,
  SyncResult,
} from "./connectorProvider.types";

export type AmazonConfig = {
  key: ConnectorKey;
  appId: string;
  clientId: string;
  clientSecret: string;
  consentUrl: string;
  tokenUrl: string;
  apiUrl: string;
  marketplaceId: string;
  draft: boolean;
  ordersIntervalMs: number;
  itemsIntervalMs: number;
  userAgent: string;
  backfillMonths: number;
};

type AmazonCredentials = Credentials & {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  sellingPartnerId: string;
};

type TokenResponse = { access_token?: string; refresh_token?: string; expires_in?: number };

type OrdersPage = {
  payload?: { Orders?: AmazonOrder[]; NextToken?: string | null };
  errors?: { message?: string }[];
};

type ItemsPage = {
  payload?: { OrderItems?: AmazonOrderItem[]; NextToken?: string | null };
};

const PAGE_SIZE = 100;
const MAX_PAGES = 500;
const ORDERS_BURST = 20;
const ITEMS_BURST = 30;
const OVERLAP_MS = 24 * 60 * 60 * 1000;
const LAG_MS = 2 * 60 * 1000;
const REFRESH_AHEAD_MS = 10 * 60 * 1000;
const CURSOR = "orders";

class AmazonError extends Error {}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class Pacer {
  private calls = 0;
  constructor(
    private readonly burst: number,
    private readonly intervalMs: number,
  ) {}
  async wait() {
    this.calls += 1;
    if (this.calls > this.burst && this.intervalMs > 0) await sleep(this.intervalMs);
  }
}

async function tokenRequest(
  config: AmazonConfig,
  body: Record<string, string>,
): Promise<TokenResponse> {
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
  if (!response.ok) throw new AmazonError(`Amazon recusou o token (${response.status})`);
  const token = (await response.json()) as TokenResponse;
  if (!token.access_token) throw new AmazonError("Amazon não devolveu o token de acesso");
  return token;
}

const credentialsOf = (
  token: TokenResponse,
  previous: Pick<AmazonCredentials, "refreshToken" | "sellingPartnerId">,
  now: Date,
): AmazonCredentials => ({
  accessToken: token.access_token ?? "",
  refreshToken: token.refresh_token ?? previous.refreshToken,
  expiresAt: new Date(now.getTime() + (token.expires_in ?? 3600) * 1000).toISOString(),
  sellingPartnerId: previous.sellingPartnerId,
});

async function apiGet<T>(
  config: AmazonConfig,
  credentials: AmazonCredentials,
  path: string,
  query: Record<string, string>,
): Promise<T> {
  const url = new URL(`${config.apiUrl.replace(/\/$/, "")}${path}`);
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  const response = await fetch(url, {
    headers: {
      "x-amz-access-token": credentials.accessToken,
      Accept: "application/json",
      "User-Agent": config.userAgent,
    },
  });
  if (!response.ok) throw new AmazonError(`Amazon respondeu ${response.status} em ${path}`);
  return (await response.json()) as T;
}

async function exchangeAmazonCode(
  config: AmazonConfig,
  { code, redirectUri, query }: ExchangeParams,
  now: Date,
): Promise<Authorized> {
  const sellingPartnerId = query["selling_partner_id"]?.trim();
  if (!sellingPartnerId) throw new AmazonError("Amazon não informou o vendedor");
  const token = await tokenRequest(config, {
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });
  if (!token.refresh_token) throw new AmazonError("Amazon não devolveu o refresh token");
  return {
    credentials: credentialsOf(token, { refreshToken: token.refresh_token, sellingPartnerId }, now),
    externalId: sellingPartnerId,
    externalLabel: `Vendedor ${sellingPartnerId}`,
  };
}

async function itemsOf(
  config: AmazonConfig,
  credentials: AmazonCredentials,
  pacer: Pacer,
  orderId: string,
): Promise<AmazonOrderItem[]> {
  const items: AmazonOrderItem[] = [];
  let nextToken: string | null = null;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    await pacer.wait();
    const body: ItemsPage = await apiGet<ItemsPage>(
      config,
      credentials,
      `/orders/v0/orders/${orderId}/orderItems`,
      nextToken ? { NextToken: nextToken } : {},
    );
    items.push(...(body.payload?.OrderItems ?? []));
    nextToken = body.payload?.NextToken ?? null;
    if (!nextToken) break;
  }
  return items;
}

async function ordersPage(
  config: AmazonConfig,
  credentials: AmazonCredentials,
  query: Record<string, string>,
): Promise<OrdersPage> {
  const body = await apiGet<OrdersPage>(config, credentials, "/orders/v0/orders", query);
  if (body.errors?.length) throw new AmazonError(body.errors[0]?.message ?? "Erro da Amazon");
  return body;
}

async function withItems(
  config: AmazonConfig,
  credentials: AmazonCredentials,
  items: Pacer,
  rows: AmazonOrder[],
): Promise<AmazonOrder[]> {
  const enriched: AmazonOrder[] = [];
  for (const order of rows) {
    if (!keepsOrderFor(config.key, amazonFulfillmentOf(order.FulfillmentChannel))) continue;
    enriched.push({
      ...order,
      items: await itemsOf(config, credentials, items, order.AmazonOrderId),
    });
  }
  return enriched;
}

async function pullOrders(
  config: AmazonConfig,
  context: SyncContext,
  since: Date,
): Promise<SyncResult> {
  const credentials = context.credentials as AmazonCredentials;
  const orders = new Pacer(ORDERS_BURST, config.ordersIntervalMs);
  const items = new Pacer(ITEMS_BURST, config.itemsIntervalMs);
  const before = new Date(context.now.getTime() - LAG_MS).toISOString();
  let latest = since.toISOString();
  let written = 0;
  let nextToken: string | null = null;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    await orders.wait();
    const body: OrdersPage = await ordersPage(
      config,
      credentials,
      nextToken
        ? { NextToken: nextToken }
        : {
            MarketplaceIds: config.marketplaceId,
            LastUpdatedAfter: latest,
            LastUpdatedBefore: before,
            MaxResultsPerPage: String(PAGE_SIZE),
          },
    );
    const rows = body.payload?.Orders ?? [];
    if (rows.length === 0) break;
    const enriched = await withItems(config, credentials, items, rows);
    await context.saveRaw(
      "order",
      enriched.map((o) => ({ externalId: o.AmazonOrderId, payload: o })),
    );
    written += await context.writeOrders(
      enriched.map(amazonOrderInputOf).filter((o) => o !== null),
    );
    for (const o of rows) {
      if (o.LastUpdateDate && o.LastUpdateDate > latest) latest = o.LastUpdateDate;
    }
    nextToken = body.payload?.NextToken ?? null;
    if (!nextToken) break;
  }
  return { cursor: { ...context.cursor, [CURSOR]: latest }, written };
}

const monthsAgo = (now: Date, months: number) => {
  const d = new Date(now);
  d.setUTCMonth(d.getUTCMonth() - months);
  return d;
};

export function amazonProvider(config: AmazonConfig): ConnectorProvider {
  return {
    key: config.key,
    authPattern: "oauth",
    authorizeUrl: ({ state, redirectUri }) => {
      const url = new URL(config.consentUrl);
      url.searchParams.set("application_id", config.appId);
      url.searchParams.set("state", state);
      url.searchParams.set("redirect_uri", redirectUri);
      if (config.draft) url.searchParams.set("version", "beta");
      return url.toString();
    },
    exchangeCode: (params) => exchangeAmazonCode(config, params, new Date()),
    async refresh(credentials, now) {
      const current = credentials as AmazonCredentials;
      if (new Date(current.expiresAt).getTime() - now.getTime() > REFRESH_AHEAD_MS) return null;
      const token = await tokenRequest(config, {
        grant_type: "refresh_token",
        refresh_token: current.refreshToken,
      });
      return credentialsOf(token, current, now);
    },
    async test(credentials) {
      const amazon = credentials as AmazonCredentials;
      await apiGet(config, amazon, "/sellers/v1/marketplaceParticipations", {});
      return { accountLabel: `Vendedor ${amazon.sellingPartnerId}` };
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
