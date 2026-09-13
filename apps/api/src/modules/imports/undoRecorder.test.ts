import { describe, expect, it } from "vitest";
import { undoRecorder } from "./undoRecorder";

describe("undoRecorder", () => {
  it("keeps the first entry per entity and key, in order", () => {
    const recorder = undoRecorder();
    recorder.add({ entity: "CUSTOMER", key: "a@b.c", previous: null });
    recorder.add({ entity: "CUSTOMER", key: "a@b.c", previous: { name: "later" } });
    recorder.add({ entity: "ORDER", key: "a@b.c", previous: null });
    expect(recorder.entries()).toEqual([
      { entity: "CUSTOMER", key: "a@b.c", previous: null },
      { entity: "ORDER", key: "a@b.c", previous: null },
    ]);
    expect(recorder.has("CUSTOMER", "a@b.c")).toBe(true);
    expect(recorder.has("PRODUCT", "a@b.c")).toBe(false);
  });
});
