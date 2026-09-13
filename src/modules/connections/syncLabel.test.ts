import { describe, expect, it } from "vitest";
import { daysBetween, syncLabelOf } from "./syncLabel";

const today = "2026-09-10";

describe("daysBetween", () => {
  it("counts calendar days between two ISO days", () => {
    expect(daysBetween("2026-09-04", today)).toBe(6);
    expect(daysBetween(today, today)).toBe(0);
  });
});

describe("syncLabelOf", () => {
  it("says the time when the source synced today", () => {
    expect(syncLabelOf("CONNECTED", new Date("2026-09-10T03:12:00Z"), today)).toBe("hoje às 03:12");
  });

  it("counts the days since the last sync otherwise", () => {
    expect(syncLabelOf("ERROR", new Date("2026-09-04T03:15:00Z"), today)).toBe("há 6 dias");
    expect(syncLabelOf("CONNECTED", new Date("2026-09-09T22:00:00Z"), today)).toBe("ontem");
  });

  it("labels a manual import by its upload day", () => {
    expect(syncLabelOf("MANUAL", new Date("2026-08-02T12:00:00Z"), today)).toBe("enviado em 02/08");
  });

  it("uses a dash when the source never synced", () => {
    expect(syncLabelOf("NOT_CONNECTED", null, today)).toBe("—");
  });
});
