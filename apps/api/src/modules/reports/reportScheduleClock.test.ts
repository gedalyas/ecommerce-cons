import { describe, expect, it } from "vitest";
import { isDue, localClockOf, slotOf, type DueFacts } from "./reportScheduleClock";

const SP = "America/Sao_Paulo";
const weekly: DueFacts = {
  enabled: true,
  frequency: "WEEKLY",
  weekday: 1,
  monthDay: null,
  hour: 8,
  lastSentAt: null,
};

describe("localClockOf", () => {
  it("reads the day, weekday and hour in the store's timezone", () => {
    const clock = localClockOf(new Date("2026-09-28T11:30:00.000Z"), SP);
    expect(clock).toEqual({ day: "2026-09-28", weekday: 1, monthDay: 28, hour: 8 });
    expect(slotOf(clock)).toBe("2026-09-28T08");
  });

  it("crosses midnight with the store, not with UTC", () => {
    expect(localClockOf(new Date("2026-09-29T02:00:00.000Z"), SP)).toMatchObject({
      day: "2026-09-28",
      hour: 23,
    });
  });
});

describe("isDue", () => {
  const monday8 = new Date("2026-09-28T11:05:00.000Z");

  it("is due on its weekday and hour, once", () => {
    expect(isDue(weekly, monday8, SP)).toBe(true);
    expect(
      isDue({ ...weekly, lastSentAt: new Date("2026-09-28T11:01:00.000Z") }, monday8, SP),
    ).toBe(false);
    expect(
      isDue({ ...weekly, lastSentAt: new Date("2026-09-21T11:01:00.000Z") }, monday8, SP),
    ).toBe(true);
  });

  it("waits for the right hour and day, and never runs switched off", () => {
    expect(isDue({ ...weekly, hour: 9 }, monday8, SP)).toBe(false);
    expect(isDue({ ...weekly, weekday: 2 }, monday8, SP)).toBe(false);
    expect(isDue({ ...weekly, enabled: false }, monday8, SP)).toBe(false);
  });

  it("goes out monthly on its day of the month", () => {
    const monthly: DueFacts = { ...weekly, frequency: "MONTHLY", weekday: null, monthDay: 28 };
    expect(isDue(monthly, monday8, SP)).toBe(true);
    expect(isDue({ ...monthly, monthDay: 5 }, monday8, SP)).toBe(false);
  });
});
