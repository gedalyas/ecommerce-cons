import { describe, expect, it } from "vitest";
import { reportScheduleSchema } from "./reportScheduleSchema";

describe("reportScheduleSchema", () => {
  const base = {
    name: "Reunião de segunda",
    sections: ["kpis"],
    frequency: "WEEKLY",
    weekday: 1,
    hour: 8,
    recipientIds: ["u1"],
  };

  it("accepts a weekly schedule and fills the defaults", () => {
    expect(reportScheduleSchema.parse(base)).toMatchObject({ monthDay: null, enabled: true });
  });

  it("asks for the day the frequency needs, a recipient and a valid hour", () => {
    const issues = (input: object) =>
      reportScheduleSchema.safeParse(input).error?.issues.map((i) => i.message) ?? [];
    expect(issues({ ...base, weekday: null })).toContain("Escolha o dia da semana.");
    expect(issues({ ...base, frequency: "MONTHLY" })).toContain("Escolha o dia do mês.");
    expect(issues({ ...base, recipientIds: [] })).toContain("Escolha ao menos um destinatário.");
    expect(issues({ ...base, hour: 24 })).toContain("Hora inválida.");
    expect(issues({ ...base, name: "Relatório\nBcc: x@y" })).toContain(
      "Use só letras, números e pontuação no nome.",
    );
    expect(issues({ ...base, monthDay: 31, frequency: "MONTHLY" }).length).toBeGreaterThan(0);
  });
});
