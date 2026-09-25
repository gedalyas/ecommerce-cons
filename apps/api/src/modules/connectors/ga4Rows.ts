import type { TrafficDetail, TrafficRow } from "@/modules/imports/contract";
import { provinceCodeOf, UNKNOWN_PROVINCE } from "./nuvemshopOrders";

export type Ga4Report = {
  dimensionHeaders?: { name: string }[];
  metricHeaders?: { name: string }[];
  rows?: { dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] }[];
};

export const GA4_FUNNEL_EVENTS = ["view_item", "add_to_cart", "begin_checkout"] as const;

export const sessionsRequest = (from: string, to: string) => ({
  dateRanges: [{ startDate: from, endDate: to }],
  dimensions: [{ name: "date" }, { name: "sessionSource" }, { name: "sessionMedium" }],
  metrics: [
    { name: "sessions" },
    { name: "totalUsers" },
    { name: "newUsers" },
    { name: "engagedSessions" },
    { name: "screenPageViews" },
    { name: "userEngagementDuration" },
    { name: "ecommercePurchases" },
  ],
  limit: 100000,
});

export const funnelRequest = (from: string, to: string) => ({
  dateRanges: [{ startDate: from, endDate: to }],
  dimensions: [
    { name: "date" },
    { name: "sessionSource" },
    { name: "sessionMedium" },
    { name: "eventName" },
  ],
  metrics: [{ name: "eventCount" }],
  dimensionFilter: {
    filter: { fieldName: "eventName", inListFilter: { values: [...GA4_FUNNEL_EVENTS] } },
  },
  limit: 100000,
});

type Cell = Record<string, string>;

export function reportCells(report: Ga4Report): Cell[] {
  const dims = (report.dimensionHeaders ?? []).map((h) => h.name);
  const metrics = (report.metricHeaders ?? []).map((h) => h.name);
  return (report.rows ?? []).map((row) => {
    const cell: Cell = {};
    dims.forEach((name, i) => {
      cell[name] = row.dimensionValues?.[i]?.value ?? "";
    });
    metrics.forEach((name, i) => {
      cell[name] = row.metricValues?.[i]?.value ?? "0";
    });
    return cell;
  });
}

const isoDay = (ga4Date: string) =>
  `${ga4Date.slice(0, 4)}-${ga4Date.slice(4, 6)}-${ga4Date.slice(6, 8)}`;

const keyOf = (c: Cell) => `${c["date"]}|${c["sessionSource"]}|${c["sessionMedium"]}`;

export function trafficRowsOf(sessions: Ga4Report, funnel: Ga4Report): TrafficRow[] {
  const events = new Map<string, Record<string, number>>();
  for (const cell of reportCells(funnel)) {
    const bucket = events.get(keyOf(cell)) ?? {};
    bucket[cell["eventName"] ?? ""] = Number(cell["eventCount"] ?? 0);
    events.set(keyOf(cell), bucket);
  }
  return reportCells(sessions).flatMap((cell, index) => {
    const date = cell["date"] ?? "";
    if (date.length !== 8) return [];
    const funnelOf = events.get(keyOf(cell)) ?? {};
    return [
      {
        row: index + 1,
        date: isoDay(date),
        source: cell["sessionSource"] || "(direct)",
        medium: cell["sessionMedium"] || "(none)",
        sessions: Number(cell["sessions"] ?? 0),
        users: Number(cell["totalUsers"] ?? 0),
        newUsers: Number(cell["newUsers"] ?? 0),
        viewItem: funnelOf["view_item"] ?? 0,
        addToCart: funnelOf["add_to_cart"] ?? 0,
        beginCheckout: funnelOf["begin_checkout"] ?? 0,
        engagedSessions: Number(cell["engagedSessions"] ?? 0),
        pageViews: Number(cell["screenPageViews"] ?? 0),
        durationSeconds: Math.round(Number(cell["userEngagementDuration"] ?? 0)),
        purchases: Number(cell["ecommercePurchases"] ?? 0),
      },
    ];
  });
}

const report = (from: string, to: string, dimensions: string[], metrics: string[]) => ({
  dateRanges: [{ startDate: from, endDate: to }],
  dimensions: dimensions.map((name) => ({ name })),
  metrics: metrics.map((name) => ({ name })),
  limit: 100000,
});

export const pagesRequest = (from: string, to: string) =>
  report(
    from,
    to,
    ["date", "pagePath"],
    ["screenPageViews", "sessions", "engagedSessions", "userEngagementDuration"],
  );

export const itemsRequest = (from: string, to: string) =>
  report(
    from,
    to,
    ["date", "itemId", "itemName"],
    ["itemsViewed", "itemsAddedToCart", "itemsPurchased"],
  );

export const audienceRequest = (
  from: string,
  to: string,
  dimension: "userGender" | "userAgeBracket",
) =>
  report(
    from,
    to,
    ["date", dimension],
    ["sessions", "engagedSessions", "totalUsers", "ecommercePurchases"],
  );

export const regionsRequest = (from: string, to: string) => ({
  ...report(
    from,
    to,
    ["date", "region"],
    ["sessions", "screenPageViews", "engagedSessions", "ecommercePurchases"],
  ),
  dimensionFilter: { filter: { fieldName: "countryId", stringFilter: { value: "BR" } } },
});

export type Ga4DetailReports = {
  pages: Ga4Report;
  items: Ga4Report;
  gender: Ga4Report;
  age: Ga4Report;
  regions: Ga4Report;
};

const n = (cell: Cell, name: string) => Math.round(Number(cell[name] ?? 0)) || 0;

const dated = (report: Ga4Report) =>
  reportCells(report).flatMap((cell) =>
    (cell["date"] ?? "").length === 8 ? [{ cell, date: isoDay(cell["date"] ?? "") }] : [],
  );

const audienceOf = (report: Ga4Report, dimension: "GENDER" | "AGE", field: string) =>
  dated(report).map(({ cell, date }) => ({
    date,
    dimension,
    value: cell[field] || "unknown",
    sessions: n(cell, "sessions"),
    engagedSessions: n(cell, "engagedSessions"),
    users: n(cell, "totalUsers"),
    purchases: n(cell, "ecommercePurchases"),
  }));

export function trafficDetailOf(reports: Ga4DetailReports): TrafficDetail {
  return {
    pages: dated(reports.pages).map(({ cell, date }) => ({
      date,
      pagePath: cell["pagePath"] || "/",
      pageViews: n(cell, "screenPageViews"),
      sessions: n(cell, "sessions"),
      engagedSessions: n(cell, "engagedSessions"),
      durationSeconds: n(cell, "userEngagementDuration"),
    })),
    items: dated(reports.items).flatMap(({ cell, date }) => {
      const itemId = cell["itemId"] ?? "";
      if (itemId === "" || itemId === "(not set)") return [];
      return [
        {
          date,
          itemId,
          itemName: cell["itemName"] || itemId,
          itemsViewed: n(cell, "itemsViewed"),
          itemsAddedToCart: n(cell, "itemsAddedToCart"),
          itemsPurchased: n(cell, "itemsPurchased"),
        },
      ];
    }),
    audience: [
      ...audienceOf(reports.gender, "GENDER", "userGender"),
      ...audienceOf(reports.age, "AGE", "userAgeBracket"),
    ],
    regions: dated(reports.regions).flatMap(({ cell, date }) => {
      const province = provinceCodeOf(cell["region"]);
      if (province === UNKNOWN_PROVINCE) return [];
      return [
        {
          date,
          province,
          sessions: n(cell, "sessions"),
          pageViews: n(cell, "screenPageViews"),
          engagedSessions: n(cell, "engagedSessions"),
          purchases: n(cell, "ecommercePurchases"),
        },
      ];
    }),
  };
}
