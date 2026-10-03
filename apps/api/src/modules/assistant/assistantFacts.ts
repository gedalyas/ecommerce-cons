import type { DataSourceState } from "@ecommerce/contracts/connections";
import type {
  ConsultingMetric,
  ConsultingSection,
  MilestoneCriterion,
} from "@ecommerce/contracts/consulting";
import type { DataSourceStatus } from "@ecommerce/contracts/connectors";
import type { CustomersAggregate, RetentionSummary } from "@ecommerce/contracts/customers";
import type { DashboardOverview } from "@ecommerce/contracts/dashboard";
import type { GoalsSummary } from "@ecommerce/contracts/goals";
import type { MarketingSalesChannels, SalesChannelRow } from "@ecommerce/contracts/marketing";
import type { MoneyDre } from "@ecommerce/contracts/money";
import { costCoverageNotice } from "@ecommerce/contracts/orders";
import {
  productsCostCoverage,
  stockSourceNotice,
  type InventoryHealth,
  type ProductSales,
} from "@ecommerce/contracts/products";
import type { DateRange } from "@ecommerce/contracts/shared/period";
import type { MetricValue } from "@ecommerce/contracts/shared/metric.types";

const TOP_PRODUCTS = 10;
const MAX_TEXT_FIELD = 160;

const clipped = (text: string) =>
  text.length > MAX_TEXT_FIELD ? `${text.slice(0, MAX_TEXT_FIELD - 1)}…` : text;

const rounded = (value: number | null) => (value === null ? null : Math.round(value * 100) / 100);

const valueOf = (metric: MetricValue) => ({
  unit: metric.unit,
  value: rounded(metric.value),
  previous: rounded(metric.previous),
  variation: rounded(metric.variation),
});

const statusMeaning: Record<DataSourceStatus, string> = {
  CONNECTED: "connected, syncing",
  ERROR: "connected but failing to sync — figures may be stale",
  MANUAL: "imported by hand from a spreadsheet",
  NOT_CONNECTED: "not connected — no data of this kind",
};

export function overviewFacts(period: DateRange, overview: DashboardOverview) {
  return {
    period,
    kpis: overview.metrics.map((m) => ({
      key: m.key,
      label: m.label,
      ...valueOf(m.metric),
      dataQuality: m.fidelityNote,
    })),
    alerts: overview.alerts.map((a) => ({
      title: clipped(a.title),
      detail: clipped(a.detail),
      area: a.origin,
    })),
    revenueBySource: overview.bySource.map((s) => ({
      source: s.label,
      revenue: rounded(s.value),
      sharePercent: rounded(s.share),
    })),
    milestone: { achieved: overview.milestone.achieved, total: overview.milestone.total },
  };
}

export function sourcesFacts(sources: readonly DataSourceState[]) {
  return sources.map((s) => ({
    source: s.name,
    category: s.kind,
    status: statusMeaning[s.status],
    lastSync: s.syncLabel,
  }));
}

export function moneyFacts(period: DateRange, dre: MoneyDre) {
  return {
    period,
    indicators: dre.indicators.map((i) => ({ label: i.label, ...valueOf(i.metric) })),
    lines: dre.matrix.rows.map((r) => ({
      label: r.label,
      total: rounded(r.total),
      previousTotal: rounded(r.previousTotal),
    })),
    costCoveragePercent: rounded(dre.costCoverage),
    costNotice: costCoverageNotice(dre.costCoverage),
  };
}

export function productsFacts(
  period: DateRange,
  sales: readonly ProductSales[],
  health: InventoryHealth,
) {
  const ranked = [...sales].sort((a, b) => b.revenue - a.revenue);
  const coverage = productsCostCoverage(sales);
  return {
    period,
    productsSold: sales.length,
    topProducts: ranked.slice(0, TOP_PRODUCTS).map((p) => ({
      name: clipped(p.name),
      category: clipped(p.category),
      units: p.units,
      revenue: rounded(p.revenue),
      orders: p.orders,
      cost: rounded(p.cost),
      stock: p.stockQty,
    })),
    stock: {
      variants: health.variants,
      untracked: health.untracked,
      outOfStock: health.outOfStock,
      stockOutRatePercent: rounded(health.stockOutRate),
      coverageDays: rounded(health.coverageDays),
      stockNotice: stockSourceNotice(health),
    },
    costNotice: costCoverageNotice(coverage),
  };
}

const channelOf = (row: SalesChannelRow) => ({
  channel: row.label,
  revenue: rounded(row.revenue),
  revenueVariation: rounded(row.revenueVariation),
  sharePercent: rounded(row.share),
  orders: row.orders,
  averageTicket: rounded(row.aov),
  sessions: row.sessions,
  conversionRate: rounded(row.conversionRate),
  investment: rounded(row.investment),
  roas: rounded(row.roas),
});

export function channelsFacts(period: DateRange, channels: MarketingSalesChannels) {
  return { period, channels: channels.rows.map(channelOf), total: channelOf(channels.total) };
}

export function customersFacts(
  period: DateRange,
  aggregate: CustomersAggregate,
  retention: RetentionSummary,
) {
  return {
    period,
    buyers: aggregate.customers,
    firstTimeBuyers: aggregate.newCustomers,
    returningBuyers: aggregate.customers - aggregate.newCustomers,
    repurchaseRateLast90DaysPercent: rounded(retention.repurchaseRate90),
    lifetimeValue12Months: rounded(retention.ltv12Months),
  };
}

export function goalsFacts(summary: GoalsSummary) {
  if (summary.empty) return { period: summary.window, goals: "No goals set for this period." };
  return {
    period: summary.window,
    elapsedPercent: rounded(summary.elapsed),
    goals: summary.cards.map((c) => ({
      label: c.label,
      unit: c.unit,
      betterWhen: c.goodWhen,
      actual: rounded(c.actual),
      goal: rounded(c.goal),
      progressPercent: rounded(c.progress),
      pacingPercent: rounded(c.pacing),
    })),
  };
}

const manualIndicatorOf = (kpi: ConsultingMetric) =>
  kpi.source === "manual" && kpi.manual
    ? [
        {
          label: kpi.label,
          value: clipped(kpi.manual.value),
          change: kpi.manual.delta === null ? null : clipped(kpi.manual.delta),
          consultantNote: clipped(kpi.manual.note),
          updatedAt: kpi.manual.updatedAt,
        },
      ]
    : [];

export function consultantFacts(
  sections: readonly ConsultingSection[],
  criteria: readonly MilestoneCriterion[],
) {
  return {
    areas: sections.map((section) => ({
      area: section.title,
      pillars: section.pillars.map((pillar) => ({
        pillar: pillar.title,
        status: pillar.status,
        dataPending: pillar.dataPending ? clipped(pillar.dataPending) : null,
        manualIndicators: pillar.kpis.flatMap(manualIndicatorOf),
        openRecommendations: pillar.recommendations
          .filter((r) => r.doneAt === null)
          .map((r) => ({ text: clipped(r.text), dueDate: r.dueDate, owner: clipped(r.owner) })),
      })),
    })),
    milestone: criteria.map((c) => ({
      criterion: c.name,
      achieved: c.achieved,
      progressPercent: rounded(c.progress),
      note: clipped(c.note),
    })),
  };
}
