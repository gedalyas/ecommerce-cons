import { describe, expect, it } from "vitest";
import { buildSection, milestoneSummaryOf, toMilestone } from "./consultingRows";

const live = {
  contributionMarginRate: {
    metric: { value: 19.2, unit: "percent" as const, previous: 21, variation: -8.6 },
    goodWhen: "up" as const,
    fidelity: "B" as const,
    fidelityNote: "Nível B — regras de custo informadas.",
  },
};

describe("buildSection", () => {
  it("renders the template with the store's status, live values and manual values", () => {
    const section = buildSection("money", {
      pillars: [{ key: "organization", status: "IN_PROGRESS", dataPending: "Falta o extrato." }],
      recommendations: [
        {
          id: "r1",
          pillarKey: "organization",
          text: "Fechar o mês",
          dueDate: new Date("2026-09-30T00:00:00Z"),
          owner: "Ana",
          doneAt: null,
        },
        {
          id: "r2",
          pillarKey: "organization",
          text: "Feito",
          dueDate: new Date("2026-09-01T00:00:00Z"),
          owner: "Ana",
          doneAt: new Date(),
        },
      ],
      manual: [
        {
          pillarKey: "organization",
          kpiKey: "freeCash",
          value: "R$ 214.000",
          delta: null,
          fidelity: "A",
          note: "extrato",
          updatedAt: new Date("2026-09-10T00:00:00Z"),
        },
      ],
      live,
      canEdit: true,
    });
    expect(section.title).toBe("Dinheiro");
    const [organization, costs] = section.pillars;
    expect(organization).toMatchObject({
      key: "organization",
      status: "in-progress",
      dataPending: "Falta o extrato.",
    });
    expect(organization!.recommendations.map((r) => r.id)).toEqual(["r1"]);
    expect(organization!.recommendations[0]!.dueDate).toBe("2026-09-30");
    const [margin, freeCash, cashCycle] = organization!.kpis;
    expect(margin).toMatchObject({ source: "live", live: { fidelity: "B" } });
    expect(freeCash).toMatchObject({
      source: "manual",
      manual: { value: "R$ 214.000" },
      fidelity: "A",
    });
    expect(cashCycle).toMatchObject({ source: "manual", manual: null, fidelity: null });
    expect(costs).toMatchObject({ key: "costs", status: "not-started" });
    expect(costs!.kpis[0]).toMatchObject({ source: "live", live: null });
  });

  it("marks milestone-gated pillars blocked when the store has no row yet", () => {
    const section = buildSection("marketing", {
      pillars: [],
      recommendations: [],
      manual: [],
      live: {},
      canEdit: false,
    });
    expect(section.pillars.find((p) => p.key === "parallelChannels")!.status).toBe("blocked");
    expect(section.canEdit).toBe(false);
  });
});

describe("toMilestone / milestoneSummaryOf", () => {
  it("fills the template from the rows and counts the achieved criteria", () => {
    const criteria = toMilestone([
      { key: "cashRunway", progress: 100, achieved: true, note: "ok" },
    ]);
    expect(criteria).toHaveLength(4);
    expect(criteria.find((c) => c.key === "cashRunway")).toMatchObject({
      achieved: true,
      note: "ok",
      name: "Caixa de 90 dias",
    });
    expect(criteria.find((c) => c.key === "cacBelowLtv")).toMatchObject({
      achieved: false,
      progress: 0,
    });
    expect(milestoneSummaryOf(criteria)).toEqual({ achieved: 1, total: 4 });
  });
});
