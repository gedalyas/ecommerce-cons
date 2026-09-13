import { describe, expect, it } from "vitest";
import { milestoneSummaryOf, toMetric, toPillar, toSection } from "./consultingRows";

const metric = {
  label: "CAC",
  value: "R$ 62",
  delta: "+21%",
  deltaDirection: "DOWN" as const,
  subNote: null,
  fidelity: "A" as const,
  fidelityNote: "Nível A — mídia sobre novos clientes.",
};

const pillar = {
  title: "Aquisição",
  status: "IN_PROGRESS" as const,
  dataPending: "Meta Ads sem sincronizar",
  extra: null,
  metrics: [metric],
  recommendations: [{ text: "Pausar campanha X", dueLabel: "até 05/09", owner: "Marina" }],
};

describe("toMetric", () => {
  it("maps the enum direction to the tile key and drops absent optionals", () => {
    expect(toMetric(metric)).toEqual({
      label: "CAC",
      value: "R$ 62",
      delta: "+21%",
      deltaDirection: "down",
      fidelity: "A",
      fidelityNote: "Nível A — mídia sobre novos clientes.",
    });
  });

  it("keeps a sub note when present", () => {
    expect(toMetric({ ...metric, subNote: "por cliente" }).subNote).toBe("por cliente");
  });
});

describe("toPillar", () => {
  it("maps the status, the KPIs and the recommendations", () => {
    const result = toPillar(pillar);
    expect(result.status).toBe("in-progress");
    expect(result.kpis).toHaveLength(1);
    expect(result.recommendations[0]).toEqual({
      text: "Pausar campanha X",
      dueDate: "até 05/09",
      owner: "Marina",
    });
    expect(result.dataPending).toBe("Meta Ads sem sincronizar");
    expect("extra" in result).toBe(false);
  });
});

describe("toSection", () => {
  it("keeps the title, the subtitle and the pillar order", () => {
    const section = toSection({
      title: "Marketing",
      subtitle: "Aquisição e retenção",
      pillars: [pillar, { ...pillar, title: "Retenção", status: "BLOCKED" }],
    });
    expect(section.pillars.map((p) => p.title)).toEqual(["Aquisição", "Retenção"]);
    expect(section.pillars[1]!.status).toBe("blocked");
  });
});

describe("milestoneSummaryOf", () => {
  it("counts the achieved criteria over the total", () => {
    const criterion = { key: "a", name: "A", progress: 100, achieved: true, note: "" };
    expect(
      milestoneSummaryOf([criterion, { ...criterion, achieved: false, progress: 40 }]),
    ).toEqual({ achieved: 1, total: 2 });
    expect(milestoneSummaryOf([])).toEqual({ achieved: 0, total: 0 });
  });
});
