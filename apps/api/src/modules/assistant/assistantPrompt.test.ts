import { describe, expect, it } from "vitest";
import { assistantSystem, conversationOf } from "./assistantPrompt";

const context = {
  storeName: "Loja Teste",
  today: "2026-10-03",
  period: { inicio: "2026-09-01", fim: "2026-09-30" },
  channel: "todos" as const,
  screen: "MONEY" as const,
  tools: ["store_overview", "money_results"] as const,
};

describe("assistantSystem", () => {
  it("tells the model the store, the day, the screen and the selected period", () => {
    const system = assistantSystem(context);
    expect(system).toContain('"Loja Teste"');
    expect(system).toContain("Today is 2026-10-03");
    expect(system).toContain("Dinheiro screen");
    expect(system).toContain("2026-09-01 to 2026-09-30");
    expect(system).toContain("store_overview, money_results");
  });

  it("falls back to the dashboard when the screen is not a store screen", () => {
    expect(assistantSystem({ ...context, screen: null })).toContain("Dashboard screen");
  });

  it("lists the pillars the answer may name", () => {
    expect(assistantSystem(context)).toContain("acquisition = Aquisição");
  });
});

describe("conversationOf", () => {
  it("keeps the turns in order", () => {
    expect(
      conversationOf([
        { role: "user", text: "Oi" },
        { role: "assistant", text: "Olá" },
      ]),
    ).toEqual([
      { role: "user", content: "Oi" },
      { role: "assistant", content: "Olá" },
    ]);
  });
});
