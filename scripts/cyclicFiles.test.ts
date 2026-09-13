import { describe, expect, it } from "vitest";
import { findCyclicComponents, summarizeCycles, type ImportGraph } from "./cyclicFiles";

const graph = (edges: Record<string, string[]>): ImportGraph => new Map(Object.entries(edges));

describe("findCyclicComponents", () => {
  it("returns nothing for an acyclic graph", () => {
    expect(findCyclicComponents(graph({ a: ["b"], b: ["c"], c: [] }))).toEqual([]);
  });

  it("finds a two-file cycle", () => {
    expect(findCyclicComponents(graph({ a: ["b"], b: ["a"] }))).toEqual([["a", "b"]]);
  });

  it("ignores self-imports and files outside the cycle", () => {
    const components = findCyclicComponents(graph({ a: ["a", "b"], b: ["c"], c: ["b"], d: ["a"] }));
    expect(components).toEqual([["b", "c"]]);
  });

  it("sorts components largest first", () => {
    const components = findCyclicComponents(
      graph({ a: ["b"], b: ["a"], x: ["y"], y: ["z"], z: ["x"] }),
    );
    expect(components).toEqual([
      ["x", "y", "z"],
      ["a", "b"],
    ]);
  });
});

describe("summarizeCycles", () => {
  it("counts files and edges inside components only", () => {
    const summary = summarizeCycles(graph({ a: ["b"], b: ["a", "c"], c: [] }));
    expect(summary.files).toBe(2);
    expect(summary.edges).toBe(2);
    expect(summary.components).toEqual([["a", "b"]]);
  });

  it("reports zero for a clean graph", () => {
    expect(summarizeCycles(graph({ a: ["b"], b: [] }))).toEqual({
      components: [],
      files: 0,
      edges: 0,
    });
  });
});
