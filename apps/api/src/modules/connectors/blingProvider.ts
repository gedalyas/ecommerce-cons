import type { ConnectorStatusOption, StatusMappingTarget } from "@ecommerce/contracts/connectors";
import {
  blingOrderInputOf,
  defaultStatusMap,
  type BlingContact,
  type BlingOrder,
  type BlingOrderSummary,
} from "./blingOrders";
import type {
  ConnectorProvider,
  Credentials,
  SyncContext,
  SyncResult,
} from "./connectorProvider.types";

export type BlingConfig = {
  clientId: string;
  clientSecret: string;
  authUrl: string;
  apiUrl: string;
  userAgent: string;
  backfillMonths: number;
  minIntervalMs: number;
};

type BlingCredentials = Credentials & {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
};

type BlingSettings = { statusMap?: Record<string, StatusMappingTarget> };

const PAGE_SIZE = 100;
const MAX_PAGES = 1000;
const REFRESH_AHEAD_MS = 10 * 60 * 1000;
const OVERLAP_DAYS = 1;
const ORDERS_CURSOR = "orders";

class BlingError extends Error {}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const dayOf = (date: Date) => date.toISOString().slice(0, 10);

async function tokenRequest(config: BlingConfig, body: Record<string, string>) {
  const basic = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
  const response = await fetch(`${config.apiUrl.replace(/\/$/, "")}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "content-type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "User-Agent": config.userAgent,
    },
    body: new URLSearchParams(body).toString(),
  });
  if (!response.ok) throw new BlingError(`Bling recusou o token (${response.status})`);
  const token = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };
  if (!token.access_token || !token.refresh_token) {
    throw new BlingError("Bling não devolveu o token de acesso");
  }
  return token;
}

function credentialsOf(
  token: { access_token?: string; refresh_token?: string; expires_in?: number },
  now: Date,
): BlingCredentials {
  return {
    accessToken: token.access_token ?? "",
    refreshToken: token.refresh_token ?? "",
    expiresAt: new Date(now.getTime() + (token.expires_in ?? 3600) * 1000).toISOString(),
  };
}

async function blingGet<T>(
  config: BlingConfig,
  credentials: BlingCredentials,
  path: string,
  query: Record<string, string> = {},
): Promise<T | null> {
  const url = new URL(`${config.apiUrl.replace(/\/$/, "")}${path}`);
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  await sleep(config.minIntervalMs);
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${credentials.accessToken}`,
      Accept: "application/json",
      "User-Agent": config.userAgent,
    },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new BlingError(`Bling respondeu ${response.status} em ${path}`);
  const body = (await response.json()) as { data?: T };
  return body.data ?? null;
}

async function statusOptions(
  config: BlingConfig,
  credentials: BlingCredentials,
): Promise<ConnectorStatusOption[]> {
  const modules = await blingGet<{ id: number | string; nome?: string }[]>(
    config,
    credentials,
    "/situacoes/modulos",
  );
  const sales = (modules ?? []).find((m) => /venda/i.test(m.nome ?? "")) ?? modules?.[0];
  if (!sales) return [];
  const statuses = await blingGet<{ id: number | string; nome?: string }[]>(
    config,
    credentials,
    `/situacoes/modulos/${sales.id}`,
  );
  return (statuses ?? []).map((s) => ({ id: String(s.id), label: s.nome ?? String(s.id) }));
}

async function channelNames(
  config: BlingConfig,
  credentials: BlingCredentials,
): Promise<Record<string, string>> {
  const channels = await blingGet<{ id: number | string; descricao?: string; nome?: string }[]>(
    config,
    credentials,
    "/canais-venda",
  );
  return Object.fromEntries(
    (channels ?? []).map((c) => [String(c.id), c.descricao ?? c.nome ?? String(c.id)]),
  );
}

async function contactOf(
  config: BlingConfig,
  credentials: BlingCredentials,
  context: SyncContext,
  cache: Map<string, BlingContact | null>,
  id: string,
): Promise<BlingContact | null> {
  const cached = cache.get(id);
  if (cached !== undefined) return cached;
  const stored = await context.readRaw<BlingContact>("customer", id);
  if (stored) {
    cache.set(id, stored);
    return stored;
  }
  const contact = await blingGet<BlingContact>(config, credentials, `/contatos/${id}`);
  if (contact) await context.saveRaw("customer", [{ externalId: id, payload: contact }]);
  cache.set(id, contact);
  return contact;
}

async function pullOrders(
  config: BlingConfig,
  context: SyncContext,
  from: string,
): Promise<SyncResult> {
  const credentials = context.credentials as BlingCredentials;
  const settings = (context.settings ?? {}) as BlingSettings;
  const statusMap =
    settings.statusMap ?? defaultStatusMap(await statusOptions(config, credentials));
  const channels = await channelNames(config, credentials);
  const contacts = new Map<string, BlingContact | null>();
  const to = dayOf(context.now);
  let written = context.reprocess ? await remapStoredOrders(context, statusMap, channels) : 0;
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const summaries = await blingGet<BlingOrderSummary[]>(config, credentials, "/pedidos/vendas", {
      dataAlteracaoInicial: from,
      dataAlteracaoFinal: to,
      pagina: String(page),
      limite: String(PAGE_SIZE),
    });
    if (!summaries || summaries.length === 0) break;
    const inputs = [];
    for (const summary of summaries) {
      const order = await blingGet<BlingOrder>(
        config,
        credentials,
        `/pedidos/vendas/${summary.id}`,
      );
      if (!order) continue;
      await context.saveRaw("order", [{ externalId: String(order.id), payload: order }]);
      const contactId = order.contato?.id;
      const contact =
        contactId === null || contactId === undefined
          ? null
          : await contactOf(config, credentials, context, contacts, String(contactId));
      const input = blingOrderInputOf(order, contact, statusMap, channels);
      if (input) inputs.push(input);
    }
    written += await context.writeOrders(inputs);
    if (summaries.length < PAGE_SIZE) break;
  }
  return { cursor: { ...context.cursor, [ORDERS_CURSOR]: to }, written };
}

const RAW_PAGE = 200;

async function remapStoredOrders(
  context: SyncContext,
  statusMap: Record<string, StatusMappingTarget>,
  channels: Record<string, string>,
): Promise<number> {
  let written = 0;
  for (let skip = 0; ; skip += RAW_PAGE) {
    const rows = await context.listRaw<BlingOrder>("order", skip, RAW_PAGE);
    if (rows.length === 0) break;
    const inputs = [];
    for (const { payload: order } of rows) {
      const contactId = order.contato?.id;
      const contact =
        contactId === null || contactId === undefined
          ? null
          : await context.readRaw<BlingContact>("customer", String(contactId));
      const input = blingOrderInputOf(order, contact, statusMap, channels);
      if (input) inputs.push(input);
    }
    written += await context.writeOrders(inputs);
    if (rows.length < RAW_PAGE) break;
  }
  return written;
}

const monthsAgo = (now: Date, months: number) => {
  const d = new Date(now);
  d.setUTCMonth(d.getUTCMonth() - months);
  return dayOf(d);
};

const daysBefore = (day: string, days: number) => {
  const d = new Date(`${day}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return dayOf(d);
};

export function blingProvider(config: BlingConfig): ConnectorProvider {
  return {
    key: "bling",
    authPattern: "oauth",
    authorizeUrl: ({ state }) =>
      `${config.authUrl.replace(/\/$/, "")}/Api/v3/oauth/authorize?response_type=code&client_id=${encodeURIComponent(config.clientId)}&state=${encodeURIComponent(state)}`,
    async exchangeCode({ code }) {
      const token = await tokenRequest(config, { grant_type: "authorization_code", code });
      return {
        credentials: credentialsOf(token, new Date()),
        externalId: "bling",
        externalLabel: "Conta Bling",
      };
    },
    async refresh(stored, now) {
      const credentials = stored as BlingCredentials;
      if (new Date(credentials.expiresAt).getTime() - now.getTime() > REFRESH_AHEAD_MS) return null;
      const token = await tokenRequest(config, {
        grant_type: "refresh_token",
        refresh_token: credentials.refreshToken,
      });
      return credentialsOf(token, now);
    },
    describeSettings: async (credentials) => ({
      statuses: await statusOptions(config, credentials as BlingCredentials),
    }),
    backfill: (context) =>
      pullOrders(config, context, monthsAgo(context.now, config.backfillMonths)),
    sync(context) {
      const last = context.cursor[ORDERS_CURSOR];
      return pullOrders(
        config,
        context,
        last ? daysBefore(last, OVERLAP_DAYS) : dayOf(context.now),
      );
    },
  };
}
