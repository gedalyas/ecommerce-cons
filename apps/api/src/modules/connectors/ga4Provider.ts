import type { ConnectorAccountOption } from "@ecommerce/contracts/connectors";
import type { ConnectorProvider, SyncContext, SyncResult } from "./connectorProvider.types";
import {
  audienceRequest,
  funnelRequest,
  itemsRequest,
  pagesRequest,
  regionsRequest,
  sessionsRequest,
  trafficDetailOf,
  trafficRowsOf,
  type Ga4Report,
} from "./ga4Rows";
import {
  GA4_SCOPE,
  googleAuthorizeUrl,
  googleExchangeCode,
  googleJson,
  googleRefresh,
  type GoogleConfig,
  type GoogleCredentials,
} from "./googleAuth";

export type Ga4Config = GoogleConfig & {
  dataApiUrl: string;
  adminApiUrl: string;
  backfillMonths: number;
};

const CURSOR = "traffic";
const OVERLAP_DAYS = 3;
const CHUNK_DAYS = 31;

const dayOf = (date: Date) => date.toISOString().slice(0, 10);
const shiftDays = (day: string, days: number) => {
  const d = new Date(`${day}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return dayOf(d);
};

type AccountSummaries = {
  accountSummaries?: {
    displayName?: string;
    propertySummaries?: { property?: string; displayName?: string }[];
  }[];
};

async function properties(
  config: Ga4Config,
  credentials: GoogleCredentials,
): Promise<ConnectorAccountOption[]> {
  const body = await googleJson<AccountSummaries>(
    `${config.adminApiUrl.replace(/\/$/, "")}/accountSummaries`,
    credentials,
    { userAgent: config.userAgent },
  );
  return (body.accountSummaries ?? []).flatMap((account) =>
    (account.propertySummaries ?? []).flatMap((p) => {
      const id = p.property?.replace(/^properties\//, "");
      if (!id) return [];
      const label = [account.displayName, p.displayName].filter(Boolean).join(" · ");
      return [{ id, label: label || `Propriedade ${id}` }];
    }),
  );
}

async function runReport(
  config: Ga4Config,
  credentials: GoogleCredentials,
  propertyId: string,
  request: unknown,
): Promise<Ga4Report> {
  return googleJson<Ga4Report>(
    `${config.dataApiUrl.replace(/\/$/, "")}/properties/${propertyId}:runReport`,
    credentials,
    { method: "POST", body: request, userAgent: config.userAgent },
  );
}

async function detailReports(
  config: Ga4Config,
  credentials: GoogleCredentials,
  propertyId: string,
  range: { start: string; end: string },
) {
  const run = (request: unknown) => runReport(config, credentials, propertyId, request);
  const [pages, items, gender, age, regions] = await Promise.all([
    run(pagesRequest(range.start, range.end)),
    run(itemsRequest(range.start, range.end)),
    run(audienceRequest(range.start, range.end, "userGender")),
    run(audienceRequest(range.start, range.end, "userAgeBracket")),
    run(regionsRequest(range.start, range.end)),
  ]);
  return trafficDetailOf({ pages, items, gender, age, regions });
}

async function pull(config: Ga4Config, context: SyncContext, from: string): Promise<SyncResult> {
  const credentials = context.credentials as GoogleCredentials;
  const propertyId = (context.settings["accountId"] as string | null | undefined) ?? null;
  if (!propertyId) throw new Error("Escolha a propriedade do GA4 nas configurações da conexão.");
  if (!(await properties(config, credentials)).some((p) => p.id === propertyId)) {
    throw new Error("A propriedade do GA4 escolhida não está mais acessível. Escolha outra.");
  }
  const to = dayOf(context.now);
  let written = 0;
  for (let start = from; start <= to; start = shiftDays(start, CHUNK_DAYS)) {
    const end = shiftDays(start, CHUNK_DAYS - 1) < to ? shiftDays(start, CHUNK_DAYS - 1) : to;
    const [sessions, funnel] = await Promise.all([
      runReport(config, credentials, propertyId, sessionsRequest(start, end)),
      runReport(config, credentials, propertyId, funnelRequest(start, end)),
    ]);
    const rows = trafficRowsOf(sessions, funnel);
    await context.saveRaw(
      "traffic",
      rows.map((r) => ({ externalId: `${r.date}|${r.source}|${r.medium}`, payload: r })),
    );
    written += await context.writeTraffic(rows);
    written += await context.writeTrafficDetail(
      await detailReports(config, credentials, propertyId, { start, end }),
    );
  }
  return { cursor: { ...context.cursor, [CURSOR]: to }, written };
}

const monthsAgo = (now: Date, months: number) => {
  const d = new Date(now);
  d.setUTCMonth(d.getUTCMonth() - months);
  return dayOf(d);
};

export function ga4Provider(config: Ga4Config): ConnectorProvider {
  return {
    key: "ga4",
    authPattern: "oauth",
    authorizeUrl: ({ state, redirectUri }) =>
      googleAuthorizeUrl(config, { state, redirectUri, scope: GA4_SCOPE }),
    async exchangeCode({ code, redirectUri }) {
      const credentials = await googleExchangeCode(config, code, redirectUri, new Date());
      const options = await properties(config, credentials);
      const first = options[0];
      return {
        credentials,
        externalId: first?.id ?? "ga4",
        externalLabel: first ? `GA4 · ${first.label}` : "Google Analytics 4",
        settings: { accountId: options.length === 1 ? (first?.id ?? null) : null },
      };
    },
    refresh: (credentials, now) => googleRefresh(config, credentials, now),
    describeSettings: async (credentials) => ({
      accounts: await properties(config, credentials as GoogleCredentials),
    }),
    backfill: (context) => pull(config, context, monthsAgo(context.now, config.backfillMonths)),
    sync(context) {
      const last = context.cursor[CURSOR];
      return pull(config, context, last ? shiftDays(last, -OVERLAP_DAYS) : dayOf(context.now));
    },
  };
}
