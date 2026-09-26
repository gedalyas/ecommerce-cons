import { describe, expect, it } from "vitest";
import { scheduleLabel } from "./reportScheduleRules";

describe("scheduleLabel", () => {
  it("says when the report goes out", () => {
    expect(scheduleLabel({ frequency: "WEEKLY", weekday: 1, monthDay: null, hour: 8 })).toBe(
      "Toda segunda às 8h",
    );
    expect(scheduleLabel({ frequency: "WEEKLY", weekday: 7, monthDay: null, hour: 18 })).toBe(
      "Todo domingo às 18h",
    );
    expect(scheduleLabel({ frequency: "MONTHLY", weekday: null, monthDay: 5, hour: 9 })).toBe(
      "Todo dia 5 às 9h",
    );
  });
});
