import { describe, expect, it } from "vitest";
import { importOutcome } from "./importOutcome";

describe("importOutcome", () => {
  it("is DONE when every row got in, PARTIAL when some were rejected, FAILED when none got in", () => {
    expect(importOutcome({ total: 10, imported: 10, rejected: 0 })).toBe("DONE");
    expect(importOutcome({ total: 10, imported: 8, rejected: 2 })).toBe("PARTIAL");
    expect(importOutcome({ total: 10, imported: 0, rejected: 10 })).toBe("FAILED");
  });
});
