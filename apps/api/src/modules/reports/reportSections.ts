import type { DashboardOverview } from "@ecommerce/contracts/dashboard";
import {
  adPlatformLabel,
  stageKeyLabel,
  type InvestmentFunnelSummary,
  type MarketingPlatformTab,
  type MarketingSalesChannels,
} from "@ecommerce/contracts/marketing";
import type {
  ReportBlock,
  ReportCell,
  ReportColumn,
  ReportSectionKey,
} from "@ecommerce/contracts/reports";

export type ReportFacts = {
  overview: DashboardOverview | null;
  meta: MarketingPlatformTab | null;
  google: MarketingPlatformTab | null;
  funnel: InvestmentFunnelSummary | null;
  salesChannels: MarketingSalesChannels | null;
};

const EMPTY_NOTE: ReportBlock = { kind: "note", text: "Sem dados no período." };
const TOP_ROWS = 10;

const cellOf = (value: unknown): ReportCell =>
  typeof value === "number" || typeof value === "string" ? value : null;

function table(columns: ReportColumn[], rows: readonly object[]): ReportBlock[] {
  if (rows.length === 0) return [EMPTY_NOTE];
  const picked = rows.map((row) =>
    Object.fromEntries(
      columns.map((c) => [c.key, cellOf((row as Record<string, unknown>)[c.key])]),
    ),
  );
  return [{ kind: "table", columns, rows: picked }];
}

function kpisBlocks({ overview }: ReportFacts): ReportBlock[] {
  if (!overview) return [EMPTY_NOTE];
  const items = overview.metrics
    .filter((m) => m.carousel)
    .map((m) => ({ label: m.label, metric: m.metric }));
  return [{ kind: "kpis", items }];
}

function salesVsInvestmentBlocks({ overview }: ReportFacts): ReportBlock[] {
  if (!overview) return [EMPTY_NOTE];
  const sold = overview.series.totalSold.current;
  const invested = new Map(
    overview.series.marketingInvestment.current.map((p) => [p.bucket, p.value]),
  );
  if (sold.length === 0) return [EMPTY_NOTE];
  return [
    {
      kind: "chart",
      chart: "lines",
      unit: "currency",
      buckets: sold.map((p) => p.bucket),
      series: [
        { key: "sold", label: "Vendido", values: sold.map((p) => p.value) },
        {
          key: "invested",
          label: "Investido",
          values: sold.map((p) => invested.get(p.bucket) ?? 0),
        },
      ],
    },
  ];
}

function roasByChannelBlocks({ overview }: ReportFacts): ReportBlock[] {
  return table(
    [
      { key: "label", label: "Canal", unit: "text" },
      { key: "revenue", label: "Vendido", unit: "currency" },
      { key: "orders", label: "Pedidos", unit: "count" },
      { key: "investment", label: "Investido", unit: "currency" },
      { key: "roas", label: "ROAS", unit: "multiplier" },
    ],
    overview?.roasByChannel ?? [],
  );
}

function channelSplitBlocks({ overview }: ReportFacts): ReportBlock[] {
  const points = overview?.channelSplit ?? [];
  if (points.length === 0) return [EMPTY_NOTE];
  return [
    {
      kind: "chart",
      chart: "bars",
      unit: "currency",
      buckets: points.map((p) => p.bucket),
      series: [
        { key: "ecommerce", label: "E-commerce", values: points.map((p) => p.ecommerce) },
        { key: "marketplace", label: "Marketplace", values: points.map((p) => p.marketplace) },
      ],
    },
  ];
}

function topProductsBlocks({ overview }: ReportFacts): ReportBlock[] {
  return table(
    [
      { key: "name", label: "Produto", unit: "text" },
      { key: "units", label: "Unidades", unit: "count" },
      { key: "revenue", label: "Vendido", unit: "currency" },
    ],
    (overview?.topProducts ?? []).slice(0, TOP_ROWS),
  );
}

function funnelBlocks({ overview }: ReportFacts): ReportBlock[] {
  return table(
    [
      { key: "label", label: "Etapa", unit: "text" },
      { key: "value", label: "Quantidade", unit: "count" },
    ],
    overview?.funnel ?? [],
  );
}

function platformBlocks(tab: MarketingPlatformTab | null): ReportBlock[] {
  if (!tab) return [EMPTY_NOTE];
  const kpi = (label: string, key: keyof MarketingPlatformTab["kpis"]) => ({
    label,
    metric: tab.kpis[key],
  });
  const campaigns = [...tab.rows].sort((a, b) => b.spend - a.spend).slice(0, TOP_ROWS);
  return [
    {
      kind: "kpis",
      items: [
        kpi("Investido", "spend"),
        kpi("Impressões", "impressions"),
        kpi("CPM", "cpm"),
        kpi("CTR", "ctr"),
        kpi("CPC", "cpc"),
        kpi("Sessões", "sessions"),
        kpi(`Compras informadas (${adPlatformLabel[tab.platform]})`, "conversions"),
        kpi("Custo por compra informada", "costPerConversion"),
      ],
    },
    ...table(
      [
        { key: "name", label: "Campanha", unit: "text" },
        { key: "spend", label: "Investido", unit: "currency" },
        { key: "impressions", label: "Impressões", unit: "count" },
        { key: "clicks", label: "Cliques", unit: "count" },
        { key: "conversions", label: "Compras informadas", unit: "count" },
      ],
      campaigns,
    ),
  ];
}

function investmentFunnelBlocks({ funnel }: ReportFacts): ReportBlock[] {
  if (!funnel) return [EMPTY_NOTE];
  return [
    { kind: "kpis", items: [{ label: "Investimento total", metric: funnel.total }] },
    ...table(
      [
        { key: "label", label: "Etapa", unit: "text" },
        { key: "spend", label: "Investido", unit: "currency" },
        { key: "share", label: "Participação", unit: "percent" },
      ],
      funnel.stages.map((s) => ({
        label: stageKeyLabel[s.stage],
        spend: s.spend.value,
        share: s.share,
      })),
    ),
  ];
}

function salesChannelsBlocks({ salesChannels }: ReportFacts): ReportBlock[] {
  return table(
    [
      { key: "label", label: "Canal", unit: "text" },
      { key: "revenue", label: "Vendido", unit: "currency" },
      { key: "orders", label: "Pedidos", unit: "count" },
      { key: "aov", label: "Ticket médio", unit: "currency" },
      { key: "sessions", label: "Sessões", unit: "count" },
      { key: "conversionRate", label: "Conversão", unit: "percent" },
      { key: "investment", label: "Investido", unit: "currency" },
      { key: "roas", label: "ROAS", unit: "multiplier" },
    ],
    salesChannels?.rows ?? [],
  );
}

export const sectionBlocks: Record<ReportSectionKey, (facts: ReportFacts) => ReportBlock[]> = {
  kpis: kpisBlocks,
  salesVsInvestment: salesVsInvestmentBlocks,
  roasByChannel: roasByChannelBlocks,
  channelSplit: channelSplitBlocks,
  topProducts: topProductsBlocks,
  funnel: funnelBlocks,
  meta: (facts) => platformBlocks(facts.meta),
  google: (facts) => platformBlocks(facts.google),
  investmentFunnel: investmentFunnelBlocks,
  salesChannels: salesChannelsBlocks,
};
