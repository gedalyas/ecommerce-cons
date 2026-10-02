import { describe, expect, it } from "vitest";
import { hasControlCharacter } from "./plainText";

describe("hasControlCharacter", () => {
  it("accepts letters, accents, digits and punctuation", () => {
    expect(hasControlCharacter("ML Matriz — São Paulo (2)")).toBe(false);
  });

  it("refuses line breaks, tabs, NUL and DEL", () => {
    expect(hasControlCharacter("a\nb")).toBe(true);
    expect(hasControlCharacter("a\tb")).toBe(true);
    expect(hasControlCharacter("a\u0000")).toBe(true);
    expect(hasControlCharacter("a\u007f")).toBe(true);
  });
});

describe("hasControlCharacter, invisible text", () => {
  it("refuses invisible and direction-changing characters", () => {
    expect(hasControlCharacter("ML‮Filial")).toBe(true);
    expect(hasControlCharacter("ML​Matriz")).toBe(true);
    expect(hasControlCharacter("a\u0085")).toBe(true);
  });
});
