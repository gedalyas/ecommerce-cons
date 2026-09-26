import { describe, expect, it } from "vitest";
import { readSlots } from "./readSlots";

describe("readSlots", () => {
  it("lends at most the limit and takes slots back", () => {
    const slots = readSlots(2);
    expect(slots.tryAcquire()).toBe(true);
    expect(slots.tryAcquire()).toBe(true);
    expect(slots.tryAcquire()).toBe(false);
    slots.release();
    expect(slots.tryAcquire()).toBe(true);
  });

  it("never goes below zero on an extra release", () => {
    const slots = readSlots(1);
    slots.release();
    expect(slots.tryAcquire()).toBe(true);
    expect(slots.tryAcquire()).toBe(false);
  });
});
