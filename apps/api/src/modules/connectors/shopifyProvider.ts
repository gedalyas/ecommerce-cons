import type {
  Authorized,
  ConnectorProvider,
  Credentials,
  ExchangeParams,
  SyncContext,
  SyncResult,
} from "./connectorProvider.types";
import {
  ORDERS_QUERY,
  shopDomainOf,
  shopifyOrderInputOf,
  verifyShopifyHmac,
  type ShopifyOrderNode,
} from "./shopifyOrders";

export type ShopifyConfig = {
  clientId: string;
  clientSecret: string;
  scopes: string;
  apiVersion: string;
  userAgent: string;
  backfillMonths: number;
  shopBaseUrl: string | null;
};

type ShopifyCredentials = Credentials & { accessToken: string; shop: string };

const PAGE_SIZE = 100;
const MAX_PAGES = 2000;
const OVERLAP_MS = 24 * 60 * 60 * 1000;
const CURSOR = "orders";

class ShopifyError extends Error {}

const shopUrl = (config: ShopifyConfig, shop: string) =>
  config.shopBaseUrl ? `${config.shopBaseUrl.replace(/\/$/, "")}/${shop}` : `https://${shop}`;

type OrdersPage = {
  data?: {
    orders?: {
      pageInfo?: { hasNextPage?: boolean; endCursor?: string | null };
      nodes?: ShopifyOrderNode[];
    };
  };
  errors?: { message?: string }[];
};

async function ordersPage(
  config: ShopifyConfig,
  credentials: ShopifyCredentials,
  variables: { first: number; after: string | null; query: string },
): Promise<OrdersPage> {
  const response = await fetch(
    `${shopUrl(config, credentials.shop)}/admin/api/${config.apiVersion}/graphql.json`,
    {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": credentials.accessToken,
        "content-type": "application/json",
        Accept: "application/json",
        "User-Agent": config.userAgent,
      },
      body: JSON.stringify({ query: ORDERS_QUERY, variables }),
    },
  );
  if (!response.ok) throw new ShopifyError(`Shopify respondeu ${response.status}`);
  const body = (await response.json()) as OrdersPage;
  if (body.errors?.length) throw new ShopifyError(body.errors[0]?.message ?? "Erro do GraphQL");
  return body;
}

async function pullOrders(
  config: ShopifyConfig,
  context: SyncContext,
  updatedAtMin: string,
): Promise<SyncResult> {
  const credentials = context.credentials as ShopifyCredentials;
  let after: string | null = null;
  let latest = updatedAtMin;
  let written = 0;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const body: OrdersPage = await ordersPage(config, credentials, {
      first: PAGE_SIZE,
      after,
      query: `updated_at:>='${updatedAtMin}'`,
    });
    const nodes = body.data?.orders?.nodes ?? [];
    if (nodes.length === 0) break;
    await context.saveRaw(
      "order",
      nodes.map((n) => ({ externalId: n.id, payload: n })),
    );
    written += await context.writeOrders(nodes.map(shopifyOrderInputOf).filter((o) => o !== null));
    for (const n of nodes) if (n.updatedAt && n.updatedAt > latest) latest = n.updatedAt;
    const info = body.data?.orders?.pageInfo;
    if (!info?.hasNextPage || !info.endCursor) break;
    after = info.endCursor;
  }
  return { cursor: { ...context.cursor, [CURSOR]: latest }, written };
}

async function exchangeShopifyCode(
  config: ShopifyConfig,
  { code, domain, query }: ExchangeParams,
): Promise<Authorized> {
  const shop = shopDomainOf(domain);
  if (!shop) throw new ShopifyError("Domínio da loja inválido");
  if (query["shop"] && query["shop"] !== shop)
    throw new ShopifyError("A loja da resposta não confere");
  if (!verifyShopifyHmac(query, config.clientSecret)) throw new ShopifyError("HMAC inválido");
  const response = await fetch(`${shopUrl(config, shop)}/admin/oauth/access_token`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Accept: "application/json",
      "User-Agent": config.userAgent,
    },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
    }),
  });
  if (!response.ok) throw new ShopifyError(`Shopify recusou o código (${response.status})`);
  const token = (await response.json()) as { access_token?: string };
  if (!token.access_token) throw new ShopifyError("Shopify não devolveu o token");
  return {
    credentials: { accessToken: token.access_token, shop },
    externalId: shop,
    externalLabel: shop,
  };
}

const monthsAgo = (now: Date, months: number) => {
  const d = new Date(now);
  d.setUTCMonth(d.getUTCMonth() - months);
  return d.toISOString();
};

export function shopifyProvider(config: ShopifyConfig): ConnectorProvider {
  return {
    key: "shopify",
    authPattern: "domain_oauth",
    authorizeUrl: ({ state, redirectUri, domain }) => {
      const shop = shopDomainOf(domain);
      if (!shop) throw new ShopifyError("Informe o domínio da loja no formato loja.myshopify.com");
      const url = new URL(`${shopUrl(config, shop)}/admin/oauth/authorize`);
      url.searchParams.set("client_id", config.clientId);
      url.searchParams.set("scope", config.scopes);
      url.searchParams.set("redirect_uri", redirectUri);
      url.searchParams.set("state", state);
      return url.toString();
    },
    exchangeCode: (params) => exchangeShopifyCode(config, params),
    backfill: (context) =>
      pullOrders(config, context, monthsAgo(context.now, config.backfillMonths)),
    sync(context) {
      const last = context.cursor[CURSOR];
      const since = last ? new Date(new Date(last).getTime() - OVERLAP_MS) : context.now;
      return pullOrders(config, context, since.toISOString());
    },
  };
}
