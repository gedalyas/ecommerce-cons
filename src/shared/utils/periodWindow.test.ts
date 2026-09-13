import { describe, expect, it } from "vitest";
import { bucketWindows, bucketsFor, fillSeries, toWindow } from "./periodWindow";

const window = toWindow({ inicio: "2026-08-28", fim: "2026-09-10" });

describe("bucketsFor", () => {
  it("lists every day of the window", () => {
    const days = bucketsFor(window, "dia");
    expect(days).toHaveLength(14);
    expect(days[0]).toBe("2026-08-28");
    expect(days[13]).toBe("2026-09-10");
  });

  it("starts weeks on Monday and months on the first", () => {
    expect(bucketsFor(window, "semana")).toEqual(["2026-08-24", "2026-08-31", "2026-09-07"]);
    expect(bucketsFor(window, "mes")).toEqual(["2026-08-01", "2026-09-01"]);
  });
});

describe("bucketWindows", () => {
  it("clips the first and last buckets to the period", () => {
    expect(bucketWindows(window, "mes")).toEqual([
      { bucket: "2026-08-01", inicio: "2026-08-28", fim: "2026-08-31" },
      { bucket: "2026-09-01", inicio: "2026-09-01", fim: "2026-09-10" },
    ]);
  });

  it("keeps whole days for daily buckets", () => {
    const [first] = bucketWindows(window, "dia");
    expect(first).toEqual({ bucket: "2026-08-28", inicio: "2026-08-28", fim: "2026-08-28" });
  });
});

describe("fillSeries", () => {
  it("zero-fills missing buckets in order", () => {
    const filled = fillSeries(toWindow({ inicio: "2026-09-01", fim: "2026-09-03" }), "dia", [
      { bucket: "2026-09-02", value: 5 },
    ]);
    expect(filled).toEqual([
      { bucket: "2026-09-01", value: 0 },
      { bucket: "2026-09-02", value: 5 },
      { bucket: "2026-09-03", value: 0 },
    ]);
  });
});
