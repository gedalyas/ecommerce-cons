import { describe, expect, it } from "vitest";
import { bucketHeader } from "./bucketHeader";

describe("bucketHeader", () => {
  it("labels a bucket by the granularity it was cut with", () => {
    expect(bucketHeader("2026-09-03", "dia")).toBe("03/09");
    expect(bucketHeader("2026-08-31", "semana")).toBe("sem. 31/08");
    expect(bucketHeader("2026-09-01", "mes")).toMatch(/set\.? de 26|set\.?\/26/);
    expect(bucketHeader("2026-01-01", "ano")).toBe("2026");
  });
});
