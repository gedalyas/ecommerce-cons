import type { AdPlatform, AudienceDimension, FunnelStage } from "../src/generated/prisma/enums.ts";

type Rng = {
  float: (min: number, max: number) => number;
  noise: (spread: number) => number;
};

type TrafficIn = { clientId: string; date: Date; sessions: number; users: number };
type AdIn = {
  clientId: string;
  date: Date;
  platform: AdPlatform;
  campaignId: string;
  campaignName: string;
  adsetId: string;
  adsetName: string;
  adId: string;
  adName: string;
  spend: number;
  platformFee: number;
  impressions: number;
  clicks: number;
  conversions: number;
  attributedRevenue: number;
};
type OrderIn = { id: string; placedAt: Date; salesPlatform: string; financialStatus: string };
type ItemIn = { orderId: string; productId: string; quantity: number };
type ProductIn = { id: string; name: string };

type CampaignMeta = {
  accountId: string;
  accountName: string;
  type: string;
  stage: FunnelStage;
};

const ECOMMERCE_META = { accountId: "act_1001", accountName: "Loja Exemplo · E-commerce" };
const STORE_META = { accountId: "act_1002", accountName: "Loja Exemplo · Lojas físicas" };
const GOOGLE_ACCOUNT = { accountId: "123-456-7890", accountName: "Loja Exemplo" };
const TIKTOK_ACCOUNT = { accountId: "tt-1001", accountName: "Loja Exemplo" };

const CAMPAIGNS: Record<string, CampaignMeta> = {
  "Prospecção · interesses casa": { ...ECOMMERCE_META, type: "CONVERSIONS", stage: "TOP" },
  "Lançamento inverno": { ...ECOMMERCE_META, type: "CONVERSIONS", stage: "TOP" },
  "Remarketing · carrinho": { ...ECOMMERCE_META, type: "CONVERSIONS", stage: "BOTTOM" },
  "Catálogo dinâmico": { ...ECOMMERCE_META, type: "CATALOG", stage: "BOTTOM" },
  "Search · marca": { ...GOOGLE_ACCOUNT, type: "SEARCH", stage: "BOTTOM" },
  "Search · categoria": { ...GOOGLE_ACCOUNT, type: "SEARCH", stage: "MIDDLE" },
  "Performance Max": { ...GOOGLE_ACCOUNT, type: "PERFORMANCE_MAX", stage: "BOTTOM" },
  "Vídeo produto": { ...TIKTOK_ACCOUNT, type: "VIDEO", stage: "TOP" },
  "Alcance · raio 5 km": { ...STORE_META, type: "REACH", stage: "TOP" },
  "Mensagens · WhatsApp VIP": { ...STORE_META, type: "MESSAGES", stage: "MIDDLE" },
};

const KEYWORDS: Record<string, readonly string[]> = {
  "Termos de marca": ["loja exemplo", "loja exemplo cama e banho"],
  "Cama e banho": ["jogo de cama casal", "toalha de banho felpuda", "edredom queen"],
  Decoração: ["almofada decorativa", "manta para sofá", "vaso decorativo"],
};

const PAGES: readonly (readonly [string, number])[] = [
  ["/", 0.34],
  ["/collections/cama", 0.14],
  ["/collections/banho", 0.11],
  ["/collections/decoracao", 0.1],
  ["/products/jogo-de-cama-percal", 0.08],
  ["/products/toalha-felpuda", 0.06],
  ["/cart", 0.07],
  ["/checkout", 0.05],
  ["/pages/trocas-e-devolucoes", 0.03],
  ["/blog/como-escolher-lencol", 0.02],
];

const GENDERS: readonly (readonly [string, number])[] = [
  ["female", 0.64],
  ["male", 0.31],
  ["unknown", 0.05],
];

const AGES: readonly (readonly [string, number])[] = [
  ["18-24", 0.11],
  ["25-34", 0.31],
  ["35-44", 0.27],
  ["45-54", 0.16],
  ["55-64", 0.1],
  ["65+", 0.05],
];

const DAY = 86_400_000;
const dayKey = (d: Date) => d.toISOString().slice(0, 10);
const round2 = (v: number) => Math.round(v * 100) / 100;

const metaOf = (campaignName: string): CampaignMeta =>
  CAMPAIGNS[campaignName] ?? { ...ECOMMERCE_META, type: "CONVERSIONS", stage: "TOP" };

function storeCampaignRows(rng: Rng, clientId: string, days: readonly Date[]): AdIn[] {
  const rows: AdIn[] = [];
  const units = [
    ["Alcance · raio 5 km", "Raio 5 km das lojas", "Vitrine da semana", 55, 7],
    ["Mensagens · WhatsApp VIP", "Clientes das lojas", "Convite grupo VIP", 38, 14],
  ] as const;
  for (const date of days) {
    for (const [campaign, adset, ad, daily, cpm] of units) {
      const spend = round2(daily * rng.noise(0.15));
      const impressions = Math.round((spend / cpm) * 1000 * rng.noise(0.1));
      const campaignId = `meta-${campaign.startsWith("Alcance") ? "alcance-raio" : "mensagens-vip"}`;
      rows.push({
        clientId,
        date,
        platform: "META",
        campaignId,
        campaignName: campaign,
        adsetId: `${campaignId}-1`,
        adsetName: adset,
        adId: `${campaignId}-1-1`,
        adName: ad,
        spend,
        platformFee: round2(spend * 0.015),
        impressions,
        clicks: Math.round(impressions * 0.009 * rng.noise(0.2)),
        conversions: 0,
        attributedRevenue: 0,
      });
    }
  }
  return rows;
}

function enrichAd<A extends AdIn>(rng: Rng, row: A) {
  const meta = metaOf(row.campaignName);
  const social = row.platform !== "GOOGLE";
  const linkClicks = social ? Math.round(row.clicks * rng.float(0.66, 0.78)) : row.clicks;
  const messages = meta.type === "MESSAGES" ? Math.round(row.clicks * rng.float(0.28, 0.4)) : 0;
  const share =
    meta.type !== "SEARCH"
      ? null
      : row.campaignName.includes("marca")
        ? rng.float(0.84, 0.95)
        : rng.float(0.34, 0.56);
  const eligibleImpressions = share == null ? 0 : Math.round(row.impressions / share);
  return {
    ...row,
    accountId: meta.accountId,
    accountName: meta.accountName,
    campaignType: meta.type,
    reach: social ? Math.round(row.impressions / rng.float(1.4, 2.2)) : 0,
    linkClicks,
    landingPageViews:
      meta.type === "REACH" || meta.type === "MESSAGES"
        ? 0
        : Math.round(linkClicks * rng.float(0.72, 0.84)),
    addToCart: Math.round(row.conversions * rng.float(3, 4.5)),
    leads: Math.round(messages * rng.float(0.3, 0.45)),
    messages,
    eligibleImpressions,
    thumbnailUrl: null,
  };
}

type KeywordRow = {
  clientId: string;
  date: Date;
  platform: AdPlatform;
  accountId: string;
  campaignId: string;
  campaignName: string;
  adGroupId: string;
  adGroupName: string;
  keyword: string;
  matchType: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
};

type EnrichedAd = ReturnType<typeof enrichAd<AdIn>>;

function keywordRows(rng: Rng, ads: readonly EnrichedAd[]): KeywordRow[] {
  const rows = new Map<string, KeywordRow>();
  for (const ad of ads) {
    const keywords = ad.campaignType === "SEARCH" ? (KEYWORDS[ad.adsetName] ?? []) : [];
    const weights = keywords.map(() => rng.float(0.6, 1.4));
    const sum = weights.reduce((acc, w) => acc + w, 0);
    keywords.forEach((keyword, i) => {
      const share = (weights[i] ?? 0) / sum;
      const matchType = i === 0 ? "EXACT" : "PHRASE";
      const key = `${dayKey(ad.date)}|${ad.adsetId}|${keyword}|${matchType}`;
      const row = rows.get(key) ?? {
        clientId: ad.clientId,
        date: ad.date,
        platform: ad.platform,
        accountId: ad.accountId,
        campaignId: ad.campaignId,
        campaignName: ad.campaignName,
        adGroupId: ad.adsetId,
        adGroupName: ad.adsetName,
        keyword,
        matchType,
        spend: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
      };
      row.spend = round2(row.spend + ad.spend * share);
      row.impressions += Math.round(ad.impressions * share);
      row.clicks += Math.round(ad.clicks * share);
      row.conversions += Math.round(ad.conversions * share);
      rows.set(key, row);
    });
  }
  return [...rows.values()];
}

function enrichTraffic<T extends TrafficIn>(rng: Rng, row: T, purchaseRate: number) {
  return {
    ...row,
    engagedSessions: Math.round(row.sessions * rng.float(0.55, 0.7)),
    pageViews: Math.round(row.sessions * rng.float(2.4, 3.6)),
    durationSeconds: Math.round(row.sessions * rng.float(80, 160)),
    purchases: Math.round(row.sessions * purchaseRate * rng.noise(0.1)),
  };
}

type DayTotals = {
  clientId: string;
  date: Date;
  sessions: number;
  users: number;
  purchases: number;
};

function dayTotals(traffic: readonly ReturnType<typeof enrichTraffic<TrafficIn>>[]): DayTotals[] {
  const byDay = new Map<string, DayTotals>();
  for (const t of traffic) {
    const key = dayKey(t.date);
    const day = byDay.get(key) ?? {
      clientId: t.clientId,
      date: t.date,
      sessions: 0,
      users: 0,
      purchases: 0,
    };
    day.sessions += t.sessions;
    day.users += t.users;
    day.purchases += t.purchases;
    byDay.set(key, day);
  }
  return [...byDay.values()];
}

function pageRows(rng: Rng, days: readonly DayTotals[]) {
  return days.flatMap((d) =>
    PAGES.map(([pagePath, share]) => {
      const sessions = Math.round(d.sessions * share * rng.noise(0.12));
      return {
        clientId: d.clientId,
        date: d.date,
        pagePath,
        pageViews: Math.round(sessions * rng.float(1.2, 1.8)),
        sessions,
        engagedSessions: Math.round(sessions * rng.float(0.5, 0.72)),
        durationSeconds: Math.round(sessions * rng.float(40, 140)),
      };
    }),
  );
}

function audienceRows(rng: Rng, days: readonly DayTotals[]) {
  const split = (d: DayTotals, dimension: AudienceDimension, groups: typeof GENDERS) =>
    groups.map(([value, share]) => {
      const sessions = Math.round(d.sessions * share * rng.noise(0.08));
      return {
        clientId: d.clientId,
        date: d.date,
        dimension,
        value,
        sessions,
        engagedSessions: Math.round(sessions * rng.float(0.55, 0.7)),
        users: Math.round(d.users * share),
        purchases: Math.round(d.purchases * share * rng.noise(0.15)),
      };
    });
  return days.flatMap((d) => [...split(d, "GENDER", GENDERS), ...split(d, "AGE", AGES)]);
}

function regionRows(
  rng: Rng,
  days: readonly DayTotals[],
  ufWeights: readonly (readonly [string, number])[],
) {
  const total = ufWeights.reduce((s, [, w]) => s + w, 0);
  return days.flatMap((d) =>
    ufWeights.map(([province, weight]) => {
      const sessions = Math.round((d.sessions * weight * rng.noise(0.1)) / total);
      return {
        clientId: d.clientId,
        date: d.date,
        province,
        sessions,
        pageViews: Math.round(sessions * rng.float(2.4, 3.6)),
        engagedSessions: Math.round(sessions * rng.float(0.55, 0.7)),
        purchases: Math.round((d.purchases * weight) / total),
      };
    }),
  );
}

function itemRows(
  rng: Rng,
  clientId: string,
  orders: readonly OrderIn[],
  items: readonly ItemIn[],
  products: readonly ProductIn[],
) {
  const siteOrders = new Map(
    orders
      .filter((o) => o.salesPlatform === "ECOMMERCE" && o.financialStatus === "PAID")
      .map((o) => [o.id, dayKey(o.placedAt)]),
  );
  const names = new Map(products.map((p) => [p.id, p.name]));
  const bought = new Map<string, { date: string; id: string; name: string; units: number }>();
  for (const item of items) {
    const date = siteOrders.get(item.orderId);
    const name = names.get(item.productId);
    if (!date || !name) continue;
    const key = `${date}|${item.productId}`;
    const row = bought.get(key) ?? { date, id: item.productId, name, units: 0 };
    row.units += item.quantity;
    bought.set(key, row);
  }
  return [...bought.values()].map((b) => ({
    clientId,
    date: new Date(`${b.date}T00:00:00.000Z`),
    itemId: b.id,
    itemName: b.name,
    itemsViewed: Math.round(b.units * rng.float(18, 30)),
    itemsAddedToCart: Math.round(b.units * rng.float(3, 5)),
    itemsPurchased: b.units,
  }));
}

function campaignTags(clientId: string, ads: readonly EnrichedAd[]) {
  const seen = new Map<
    string,
    {
      clientId: string;
      platform: AdPlatform;
      campaignId: string;
      stage: FunnelStage;
      channel: string;
    }
  >();
  for (const ad of ads) {
    if (ad.campaignName === "Search · categoria") continue;
    seen.set(`${ad.platform}|${ad.campaignId}`, {
      clientId,
      platform: ad.platform,
      campaignId: ad.campaignId,
      stage: metaOf(ad.campaignName).stage,
      channel: "site",
    });
  }
  return [...seen.values()];
}

export function buildMarketingDepth<T extends TrafficIn, A extends AdIn>(
  rng: Rng,
  input: {
    clientId: string;
    traffic: readonly T[];
    adSpend: readonly A[];
    orders: readonly OrderIn[];
    items: readonly ItemIn[];
    products: readonly ProductIn[];
    ufWeights: readonly (readonly [string, number])[];
    firstDay: Date;
    lastDay: Date;
  },
) {
  const days: Date[] = [];
  for (let t = input.firstDay.getTime(); t <= input.lastDay.getTime(); t += DAY)
    days.push(new Date(t));
  const ads = [...input.adSpend, ...storeCampaignRows(rng, input.clientId, days)].map((a) =>
    enrichAd(rng, a),
  );
  const traffic = input.traffic.map((t) => enrichTraffic(rng, t, 0.017));
  const totals = dayTotals(traffic);
  return {
    traffic,
    adSpend: ads,
    keywords: keywordRows(rng, ads),
    pages: pageRows(rng, totals),
    audience: audienceRows(rng, totals),
    regions: regionRows(rng, totals, input.ufWeights),
    items: itemRows(rng, input.clientId, input.orders, input.items, input.products),
    tags: campaignTags(input.clientId, ads),
  };
}
