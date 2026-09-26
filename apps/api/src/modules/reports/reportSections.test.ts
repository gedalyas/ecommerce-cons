import { describe, expect, it } from "vitest";
import type { DashboardOverview } from "@ecommerce/contracts/dashboard";
import type {
  InvestmentFunnelSummary,
  MarketingSalesChannels,
} from "@ecommerce/contracts/marketing";
import { sectionBlocks, type ReportFacts } from "./reportSections";

const noFacts: ReportFacts = {
  overview: null,
  meta: null,
  google: null,
  funnel: null,
  salesChannels: null,
};

const withOverview = (overview: Partial<DashboardOverview>): ReportFacts => ({
  ...noFacts,
  overview: overview as DashboardOverview,
});

describe("sectionBlocks", () => {
  it("splits sales by channel into bars per bucket", () => {
    const facts = withOverview({
      channelSplit: [{ bucket: "2026-09-01", ecommerce: 100, marketplace: 40 }],
    });
    expect(sectionBlocks.channelSplit(facts)).toEqual([
      {
        kind: "chart",
        chart: "bars",
        unit: "currency",
        buckets: ["2026-09-01"],
        series: [
          { key: "ecommerce", label: "E-commerce", values: [100] },
          { key: "marketplace", label: "Marketplace", values: [40] },
        ],
      },
    ]);
  });

  it("lists at most ten products with units and revenue", () => {
    const topProducts = Array.from({ length: 12 }, (_, i) => ({
      productId: `p${i}`,
      name: `Produto ${i}`,
      revenue: 100 - i,
      units: i,
    }));
    const [block] = sectionBlocks.topProducts(withOverview({ topProducts }));
    expect(block?.kind === "table" && block.rows).toHaveLength(10);
    expect(block?.kind === "table" && block.rows[0]).toEqual({
      name: "Produto 0",
      units: 0,
      revenue: 100,
    });
  });

  it("shows the sales funnel steps as counts", () => {
    const [block] = sectionBlocks.funnel(
      withOverview({ funnel: [{ key: "sessions", label: "Sessões", value: 900 }] }),
    );
    expect(block).toMatchObject({ kind: "table", rows: [{ label: "Sessões", value: 900 }] });
  });

  it("gives the investment funnel's total and its stages with their share", () => {
    const total = { value: 1000, unit: "currency" as const, previous: null, variation: null };
    const funnel = {
      total,
      stages: [{ stage: "TOP", spend: { ...total, value: 600 }, share: 60, byPlatform: [] }],
    } as unknown as InvestmentFunnelSummary;
    const [kpis, table] = sectionBlocks.investmentFunnel({ ...noFacts, funnel });
    expect(kpis).toEqual({
      kind: "kpis",
      items: [{ label: "Investimento total", metric: total, goodWhen: "down" }],
    });
    expect(table).toMatchObject({
      kind: "table",
      rows: [{ label: "Topo", spend: 600, share: 60 }],
    });
  });

  it("keeps the sales channels' numbers and a dash-worthy null for missing sessions", () => {
    const salesChannels = {
      rows: [
        {
          key: "site",
          label: "Site",
          revenue: 500,
          revenueVariation: null,
          share: 1,
          orders: 5,
          aov: 100,
          aovVariation: null,
          sessions: null,
          conversionRate: null,
          conversionVariation: null,
          investment: 50,
          roas: 10,
        },
      ],
    } as unknown as MarketingSalesChannels;
    const [block] = sectionBlocks.salesChannels({ ...noFacts, salesChannels });
    expect(block?.kind === "table" && block.rows[0]).toEqual({
      label: "Site",
      revenue: 500,
      orders: 5,
      aov: 100,
      sessions: null,
      conversionRate: null,
      investment: 50,
      roas: 10,
    });
  });
});
