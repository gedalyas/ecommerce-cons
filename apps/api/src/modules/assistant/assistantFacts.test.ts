import { describe, expect, it } from "vitest";
import type { DataSourceState } from "@ecommerce/contracts/connections";
import type { ConsultingSection } from "@ecommerce/contracts/consulting";
import type { DashboardOverview } from "@ecommerce/contracts/dashboard";
import type { GoalsSummary } from "@ecommerce/contracts/goals";
import type { SalesChannelRow } from "@ecommerce/contracts/marketing";
import type { MoneyDre } from "@ecommerce/contracts/money";
import type { ProductSales } from "@ecommerce/contracts/products";
import {
  channelsFacts,
  consultantFacts,
  customersFacts,
  goalsFacts,
  moneyFacts,
  overviewFacts,
  productsFacts,
  sourcesFacts,
} from "./assistantFacts";

const period = { inicio: "2026-09-01", fim: "2026-09-30" };

describe("overviewFacts", () => {
  it("keeps each KPI with its data-quality note and drops the chart data", () => {
    const overview = {
      metrics: [
        {
          key: "totalSold",
          label: "Total vendido",
          metric: { unit: "currency", value: 1234.567, previous: 1000, variation: 23.4567 },
          fidelityNote: "Nível A — calculado sobre vendas.",
        },
      ],
      alerts: [{ title: "Vendas caíram", detail: "−20% na semana", origin: "Pedidos" }],
      bySource: [{ key: "site", label: "Site", value: 800, share: 64.8 }],
      milestone: { criteria: [], achieved: 1, total: 4 },
      series: { totalSold: { current: [], previous: null } },
    } as unknown as DashboardOverview;
    expect(overviewFacts(period, overview)).toEqual({
      period,
      kpis: [
        {
          key: "totalSold",
          label: "Total vendido",
          unit: "currency",
          value: 1234.57,
          previous: 1000,
          variation: 23.46,
          dataQuality: "Nível A — calculado sobre vendas.",
        },
      ],
      alerts: [{ title: "Vendas caíram", detail: "−20% na semana", area: "Pedidos" }],
      revenueBySource: [{ source: "Site", revenue: 800, sharePercent: 64.8 }],
      milestone: { achieved: 1, total: 4 },
    });
  });
});

describe("sourcesFacts", () => {
  it("spells out what each status means for the figures", () => {
    const sources: DataSourceState[] = [
      {
        connectorKey: "bling",
        name: "Bling",
        kind: "Vendas",
        status: "ERROR",
        syncLabel: "há 6 dias",
      },
    ];
    expect(sourcesFacts(sources)).toEqual([
      {
        source: "Bling",
        category: "Vendas",
        status: "connected but failing to sync — figures may be stale",
        lastSync: "há 6 dias",
      },
    ]);
  });
});

describe("moneyFacts", () => {
  it("carries the cost notice when the cost of goods is unknown", () => {
    const dre = {
      indicators: [],
      costCoverage: 40,
      matrix: {
        buckets: [],
        rows: [
          { key: "cogs", label: "CMV", level: 1, values: [], total: null, previousTotal: null },
        ],
      },
    } as unknown as MoneyDre;
    const facts = moneyFacts(period, dre);
    expect(facts.lines).toEqual([{ label: "CMV", total: null, previousTotal: null }]);
    expect(facts.costCoveragePercent).toBe(40);
    expect(facts.costNotice).toContain("custo");
  });
});

describe("productsFacts", () => {
  const product = (name: string, revenue: number, cost: number | null): ProductSales => ({
    productId: name,
    name,
    category: "Geral",
    subcategory: null,
    brand: null,
    collection: null,
    units: 1,
    revenue,
    cost,
    orders: 1,
    stockQty: null,
  });

  it("ranks the products by revenue and keeps the top ten", () => {
    const sales = Array.from({ length: 12 }, (_, i) => product(`P${i}`, i * 10, 1));
    const facts = productsFacts(period, sales, {
      variants: 12,
      untracked: 0,
      outOfStock: 0,
      stockOutRate: 0,
      coverageDays: 30,
    });
    expect(facts.productsSold).toBe(12);
    expect(facts.topProducts).toHaveLength(10);
    expect(facts.topProducts[0]?.name).toBe("P11");
    expect(facts.stock.stockNotice).toBeNull();
    expect(facts.costNotice).toBeNull();
  });

  it("clips the text a product brings, so a long name cannot flood the prompt", () => {
    const facts = productsFacts(period, [product("N".repeat(500), 10, 1)], {
      variants: 1,
      untracked: 0,
      outOfStock: 0,
      stockOutRate: 0,
      coverageDays: null,
    });
    expect(facts.topProducts[0]?.name).toHaveLength(160);
    expect(facts.topProducts[0]?.name.endsWith("…")).toBe(true);
  });

  it("says when stock has no source and cost is missing", () => {
    const facts = productsFacts(period, [product("A", 100, null)], {
      variants: 0,
      untracked: 0,
      outOfStock: 0,
      stockOutRate: null,
      coverageDays: null,
    });
    expect(facts.costNotice).not.toBeNull();
    expect(facts.stock.stockNotice).toBeNull();
  });
});

describe("channelsFacts", () => {
  it("maps each channel and the total", () => {
    const row: SalesChannelRow = {
      key: "site",
      label: "Site",
      revenue: 100,
      revenueVariation: null,
      share: 100,
      orders: 2,
      aov: 50,
      aovVariation: null,
      sessions: 40,
      conversionRate: 5,
      conversionVariation: null,
      investment: 20,
      roas: 5,
    };
    expect(channelsFacts(period, { rows: [row], total: row }).total).toEqual({
      channel: "Site",
      revenue: 100,
      revenueVariation: null,
      sharePercent: 100,
      orders: 2,
      averageTicket: 50,
      sessions: 40,
      conversionRate: 5,
      investment: 20,
      roas: 5,
    });
  });
});

describe("customersFacts", () => {
  it("derives the returning buyers", () => {
    const facts = customersFacts(
      period,
      { customers: 10, newCustomers: 4 },
      { repurchaseRate90: 12.345, ltv12Months: null },
    );
    expect(facts).toMatchObject({ returningBuyers: 6, repurchaseRateLast90DaysPercent: 12.35 });
  });
});

describe("goalsFacts", () => {
  it("says when the period has no goals", () => {
    const summary: GoalsSummary = { cards: [], window: period, elapsed: 50, empty: true };
    expect(goalsFacts(summary)).toEqual({ period, goals: "No goals set for this period." });
  });
});

describe("consultantFacts", () => {
  const section: ConsultingSection = {
    key: "money",
    title: "Dinheiro",
    subtitle: "",
    canEdit: false,
    pillars: [
      {
        key: "organization",
        title: "Organização",
        status: "in-progress",
        kpis: [
          {
            key: "contributionMarginRate",
            label: "Margem de contribuição",
            source: "live",
            live: null,
          },
          {
            key: "freeCash",
            label: "Caixa livre",
            source: "manual",
            hint: "",
            manual: {
              value: "R$ 40 mil",
              delta: null,
              note: "Fechamento de setembro",
              updatedAt: "2026-09-30",
            },
            fidelity: "B",
          },
          {
            key: "cashCycle",
            label: "Ciclo de caixa",
            source: "manual",
            hint: "",
            manual: null,
            fidelity: null,
          },
        ],
        recommendations: [
          {
            id: "1",
            pillarKey: "organization",
            text: "Separar contas",
            dueDate: "2026-10-10",
            owner: "Dono",
            doneAt: null,
          },
          {
            id: "2",
            pillarKey: "organization",
            text: "Feito",
            dueDate: "2026-09-01",
            owner: "Dono",
            doneAt: "2026-09-02",
          },
        ],
      },
    ],
  };

  it("keeps the consultant's indicators and the open recommendations of each pillar", () => {
    const facts = consultantFacts(
      [section],
      [
        {
          key: "predictableMargin",
          name: "Margem previsível",
          hint: "",
          progress: 50,
          achieved: false,
          note: "",
        },
      ],
    );
    expect(facts.areas[0]?.pillars[0]).toEqual({
      pillar: "Organização",
      status: "in-progress",
      dataPending: null,
      manualIndicators: [
        {
          label: "Caixa livre",
          value: "R$ 40 mil",
          change: null,
          consultantNote: "Fechamento de setembro",
          updatedAt: "2026-09-30",
        },
      ],
      openRecommendations: [{ text: "Separar contas", dueDate: "2026-10-10", owner: "Dono" }],
    });
    expect(facts.milestone).toEqual([
      { criterion: "Margem previsível", achieved: false, progressPercent: 50, note: "" },
    ]);
  });
});
