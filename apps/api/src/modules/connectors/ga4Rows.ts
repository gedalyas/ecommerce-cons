import type { TrafficRow } from "@/modules/imports/contract";

export type Ga4Report = {
  dimensionHeaders?: { name: string }[];
  metricHeaders?: { name: string }[];
  rows?: { dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] }[];
};

export const GA4_FUNNEL_EVENTS = ["view_item", "add_to_cart", "begin_checkout"] as const;

export const sessionsRequest = (from: string, to: string) => ({
  dateRanges: [{ startDate: from, endDate: to }],
  dimensions: [{ name: "date" }, { name: "sessionSource" }, { name: "sessionMedium" }],
  metrics: [{ name: "sessions" }, { name: "totalUsers" }, { name: "newUsers" }],
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
      },
    ];
  });
}
