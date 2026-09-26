import { describe, expect, it } from "vitest";
import { dayOptions, draftOf, hourOptions, withFrequency } from "./scheduleFormRules";

describe("options", () => {
  it("offers 24 hours, the weekdays and 28 days of the month", () => {
    expect(hourOptions).toHaveLength(24);
    expect(hourOptions[8]).toEqual({ value: "8", label: "8h" });
    expect(dayOptions("WEEKLY")[0]).toEqual({ value: "1", label: "segunda" });
    expect(dayOptions("MONTHLY")).toHaveLength(28);
  });
});

describe("draftOf", () => {
  it("starts a new schedule on Monday at 8h, to the person, with the chosen sections", () => {
    expect(draftOf(null, ["kpis"], "me")).toEqual({
      name: "Reunião semanal",
      sections: ["kpis"],
      frequency: "WEEKLY",
      weekday: 1,
      monthDay: null,
      hour: 8,
      recipientIds: ["me"],
      enabled: true,
    });
  });

  it("edits an existing schedule without its id or last sending", () => {
    const draft = draftOf(
      {
        id: "s1",
        name: "Mês",
        sections: ["meta"],
        frequency: "MONTHLY",
        weekday: null,
        monthDay: 5,
        hour: 9,
        recipientIds: ["me"],
        enabled: false,
        lastSentAt: "2026-09-05T12:00:00.000Z",
      },
      ["kpis"],
      "me",
    );
    expect(draft).not.toHaveProperty("id");
    expect(draft).toMatchObject({ name: "Mês", monthDay: 5, enabled: false });
  });
});

describe("withFrequency", () => {
  it("keeps only the day the frequency uses", () => {
    const weekly = draftOf(null, ["kpis"], "me");
    expect(withFrequency(weekly, "MONTHLY")).toMatchObject({ weekday: null, monthDay: 1 });
    expect(withFrequency(withFrequency(weekly, "MONTHLY"), "WEEKLY")).toMatchObject({
      weekday: 1,
      monthDay: null,
    });
  });
});
