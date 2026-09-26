import { describe, expect, it } from "vitest";
import type { DashboardOverview } from "@ecommerce/contracts/dashboard";
import type { MarketingPlatformTab } from "@ecommerce/contracts/marketing";
import type { ReportSectionKey } from "@ecommerce/contracts/reports";
import type { MetricValue } from "@ecommerce/contracts/shared/metric.types";
import { reportDocumentOf } from "./reportDocument";
import type { ReportFacts } from "./reportSections";

const metric = (value: number | null): MetricValue => ({
  value,
  unit: "currency",
  previous: null,
  variation: null,
});

const noFacts: ReportFacts = {
  overview: null,
  meta: null,
  google: null,
  funnel: null,
  salesChannels: null,
};

const input = (sections: ReportSectionKey[], facts = noFacts) =>
  reportDocumentOf({
    storeName: "Loja Exemplo",
    range: { inicio: "2026-09-01", fim: "2026-09-30" },
    generatedAt: "2026-09-25T12:00:00.000Z",
    sections,
    facts,
  });

describe("reportDocumentOf", () => {
  it("titles the report and keeps the catalogue's order, whatever the request's order", () => {
    const doc = input(["meta", "kpis"]);
    expect(doc.title).toBe("Relatório — Loja Exemplo");
    expect(doc.sections.map((s) => s.key)).toEqual(["kpis", "meta"]);
    expect(doc.sections[0]?.title).toBe("Indicadores do período");
  });

  it("says there is no data instead of drawing an empty chart or table", () => {
    const doc = input(["kpis", "salesVsInvestment", "roasByChannel", "meta", "salesChannels"]);
    for (const section of doc.sections) {
      expect(section.blocks).toEqual([{ kind: "note", text: "Sem dados no período." }]);
    }
  });

  it("draws sold against invested per bucket and keeps only the table's columns", () => {
    const series = (values: number[]) => ({
      current: values.map((value, i) => ({ bucket: `2026-09-0${i + 1}`, value })),
      previous: null,
    });
    const overview = {
      metrics: [
        { key: "totalSold", label: "Total vendido", carousel: true, metric: metric(100) },
        { key: "repurchaseRate", label: "Recompra", carousel: false, metric: metric(1) },
      ],
      series: { totalSold: series([100, 200]), marketingInvestment: series([10]) },
      roasByChannel: [
        { key: "site", label: "Site", revenue: 300, orders: 3, investment: 10, roas: 30 },
      ],
    } as unknown as DashboardOverview;
    const doc = input(["kpis", "salesVsInvestment", "roasByChannel"], { ...noFacts, overview });
    expect(doc.sections[0]?.blocks).toEqual([
      { kind: "kpis", items: [{ label: "Total vendido", metric: metric(100) }] },
    ]);
    expect(doc.sections[1]?.blocks[0]).toMatchObject({
      kind: "chart",
      buckets: ["2026-09-01", "2026-09-02"],
      series: [
        { key: "sold", values: [100, 200] },
        { key: "invested", values: [10, 0] },
      ],
    });
    expect(doc.sections[2]?.blocks[0]).toMatchObject({
      kind: "table",
      rows: [{ label: "Site", revenue: 300, orders: 3, investment: 10, roas: 30 }],
    });
  });

  it("lists a platform's top campaigns by spend, labelling platform purchases as reported counts", () => {
    const row = (name: string, spend: number) => ({
      name,
      spend,
      impressions: 1000,
      clicks: 10,
      conversions: 1,
      thumbnailUrl: "https://x",
    });
    const kpis = new Proxy({}, { get: () => metric(1) });
    const meta = {
      platform: "META",
      kpis,
      rows: [row("B", 5), row("A", 50)],
    } as unknown as MarketingPlatformTab;
    const [kpiBlock, tableBlock] = input(["meta"], { ...noFacts, meta }).sections[0]?.blocks ?? [];
    expect(kpiBlock?.kind === "kpis" && kpiBlock.items.map((i) => i.label)).toContain(
      "Compras informadas (Meta Ads)",
    );
    expect(tableBlock?.kind === "table" && tableBlock.rows.map((r) => r["name"])).toEqual([
      "A",
      "B",
    ]);
    expect(tableBlock?.kind === "table" && Object.keys(tableBlock.rows[0] ?? {})).not.toContain(
      "thumbnailUrl",
    );
  });
});
