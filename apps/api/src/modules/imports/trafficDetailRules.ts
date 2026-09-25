import { daysSince } from "@ecommerce/contracts/connectors";
import type {
  AudienceRow,
  ItemRow,
  KeywordRow,
  PageRow,
  RegionRow,
  TrafficDetail,
} from "./importRows.types";

const PATH_LIMIT = 300;
const TEXT_LIMIT = 200;

export function normalizePagePath(path: string): string {
  const withoutQuery = path.trim().split(/[?#]/)[0] ?? "";
  const clean = withoutQuery.length > 1 ? withoutQuery.replace(/\/+$/, "") : withoutQuery;
  return (clean.startsWith("/") ? clean : `/${clean}`).slice(0, PATH_LIMIT);
}

type Numeric<T> = { [K in keyof T]: T[K] extends number ? K : never }[keyof T];

export function mergeRows<T>(
  rows: readonly T[],
  keyOf: (row: T) => string,
  counters: readonly Numeric<T>[],
): T[] {
  const merged = new Map<string, T>();
  for (const row of rows) {
    const key = keyOf(row);
    const current = merged.get(key);
    if (!current) {
      merged.set(key, { ...row });
      continue;
    }
    for (const field of counters) {
      (current[field] as number) = (current[field] as number) + (row[field] as number);
    }
  }
  return [...merged.values()];
}

export const mergeKeywords = (rows: readonly KeywordRow[]): KeywordRow[] =>
  mergeRows(
    rows.map((r) => ({ ...r, keyword: r.keyword.trim().slice(0, TEXT_LIMIT) })),
    (r) => [r.date, r.platform, r.accountId, r.adGroupId, r.keyword, r.matchType].join("|"),
    ["spend", "impressions", "clicks", "conversions"],
  );

const mergePages = (rows: readonly PageRow[]): PageRow[] =>
  mergeRows(
    rows.map((r) => ({ ...r, pagePath: normalizePagePath(r.pagePath) })),
    (r) => `${r.date}|${r.pagePath}`,
    ["pageViews", "sessions", "engagedSessions", "durationSeconds"],
  );

const mergeItems = (rows: readonly ItemRow[]): ItemRow[] =>
  mergeRows(
    rows
      .map((r) => ({ ...r, itemId: r.itemId.trim().slice(0, TEXT_LIMIT) }))
      .filter((r) => r.itemId !== ""),
    (r) => `${r.date}|${r.itemId}`,
    ["itemsViewed", "itemsAddedToCart", "itemsPurchased"],
  );

const mergeAudience = (rows: readonly AudienceRow[]): AudienceRow[] =>
  mergeRows(rows, (r) => `${r.date}|${r.dimension}|${r.value}`, [
    "sessions",
    "engagedSessions",
    "users",
    "purchases",
  ]);

const mergeRegions = (rows: readonly RegionRow[]): RegionRow[] =>
  mergeRows(rows, (r) => `${r.date}|${r.province}`, [
    "sessions",
    "pageViews",
    "engagedSessions",
    "purchases",
  ]);

export const mergeTrafficDetail = (detail: TrafficDetail): TrafficDetail => ({
  pages: mergePages(detail.pages),
  items: mergeItems(detail.items),
  audience: mergeAudience(detail.audience),
  regions: mergeRegions(detail.regions),
});

export const daysOf = (rows: readonly { date: string }[]): string[] => [
  ...new Set(rows.map((r) => r.date)),
];

export const trafficDetailSince = (detail: TrafficDetail, since: string | null): TrafficDetail => ({
  pages: daysSince(detail.pages, since),
  items: daysSince(detail.items, since),
  audience: daysSince(detail.audience, since),
  regions: daysSince(detail.regions, since),
});
