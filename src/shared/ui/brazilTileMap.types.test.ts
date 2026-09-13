import { describe, expect, it } from "vitest";
import { brazilStates, intensityOf } from "./brazilTileMap.types";

describe("intensityOf", () => {
  it("maps a value to one of five levels", () => {
    expect(intensityOf(null, 100)).toBe(0);
    expect(intensityOf(0, 100)).toBe(0);
    expect(intensityOf(1, 100)).toBe(1);
    expect(intensityOf(50, 100)).toBe(2);
    expect(intensityOf(100, 100)).toBe(4);
  });

  it("lists the 27 federative units", () => {
    expect(brazilStates).toHaveLength(27);
  });
});
