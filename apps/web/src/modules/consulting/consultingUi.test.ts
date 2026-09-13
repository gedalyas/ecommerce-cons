import { describe, expect, it } from "vitest";
import { metricTileOf, recommendationOf } from "./consultingUi";

describe("metricTileOf", () => {
  it("formats a live KPI with its comparison and keeps the sub note", () => {
    const tile = metricTileOf(
      {
        key: "aov",
        label: "Ticket médio",
        source: "live",
        live: {
          metric: { value: 259.4, unit: "currency", previous: 240, variation: 8.08 },
          goodWhen: "up",
          fidelity: "A",
          fidelityNote: "Nível A — receita ÷ pedidos.",
          subNote: "pedidos pagos",
        },
      },
      "vs mês anterior",
    );
    expect(tile).toMatchObject({
      value: "R$ 259",
      delta: "+8,1%",
      deltaDirection: "up",
      deltaLabel: "vs mês anterior",
      fidelity: "A",
      subNote: "pedidos pagos",
    });
  });

  it("renders a dash and a C seal when the live KPI has no value", () => {
    const tile = metricTileOf({ key: "cac", label: "CAC", source: "live", live: null }, "x");
    expect(tile).toMatchObject({ value: "—", fidelity: "C", subNote: "sem dados no período" });
  });

  it("renders the consultant's value for a manual KPI, or the hint when empty", () => {
    const filled = metricTileOf(
      {
        key: "freeCash",
        label: "Caixa livre",
        source: "manual",
        hint: "Saldo em caixa",
        manual: {
          value: "R$ 214.000",
          delta: null,
          note: "extrato",
          updatedAt: "2026-09-10T00:00:00.000Z",
        },
        fidelity: "A",
      },
      "x",
    );
    expect(filled).toMatchObject({ value: "R$ 214.000", fidelity: "A", subNote: "extrato" });
    expect(filled.fidelityNote).toMatch(/informado pela consultoria em \d{2}\/09/);
    const empty = metricTileOf(
      {
        key: "freeCash",
        label: "Caixa livre",
        source: "manual",
        hint: "Saldo em caixa",
        manual: null,
        fidelity: null,
      },
      "x",
    );
    expect(empty).toMatchObject({ value: "—", fidelity: "C", subNote: "Saldo em caixa" });
  });
});

describe("recommendationOf", () => {
  it("formats the due date the way the list shows it", () => {
    expect(
      recommendationOf({
        id: "r",
        pillarKey: null,
        text: "Fazer",
        dueDate: "2026-10-05",
        owner: "Ana",
        doneAt: null,
      }),
    ).toEqual({ text: "Fazer", dueDate: "até 05/10", owner: "Ana" });
  });
});
