import { describe, expect, it } from "vitest";
import { frequencyScore, quintileScorer, segmentFor } from "./rfmSegments";

describe("segmentFor", () => {
  it("labels the best recent, frequent, high-spending customers as champions", () => {
    expect(segmentFor({ r: 5, f: 3, m: 5 })).toBe("Campeões");
    expect(segmentFor({ r: 4, f: 4, m: 4 })).toBe("Campeões");
  });

  it("keeps loyal buyers who went quiet apart from active loyal ones", () => {
    expect(segmentFor({ r: 1, f: 3, m: 2 })).toBe("Não pode perder");
    expect(segmentFor({ r: 3, f: 3, m: 2 })).toBe("Leais");
  });

  it("splits single-order buyers by recency", () => {
    expect(segmentFor({ r: 5, f: 1, m: 1 })).toBe("Novos");
    expect(segmentFor({ r: 3, f: 1, m: 3 })).toBe("Promissores");
    expect(segmentFor({ r: 1, f: 1, m: 5 })).toBe("Perdidos");
    expect(segmentFor({ r: 2, f: 1, m: 2 })).toBe("Hibernando");
  });

  it("flags two-order buyers by recency", () => {
    expect(segmentFor({ r: 4, f: 2, m: 3 })).toBe("Potenciais leais");
    expect(segmentFor({ r: 3, f: 2, m: 3 })).toBe("Precisam de atenção");
    expect(segmentFor({ r: 1, f: 2, m: 3 })).toBe("Em risco");
  });
});

describe("frequencyScore", () => {
  it("caps at five orders", () => {
    expect(frequencyScore(1)).toBe(1);
    expect(frequencyScore(4)).toBe(4);
    expect(frequencyScore(12)).toBe(5);
  });
});

describe("quintileScorer", () => {
  const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

  it("ranks high values best when higher is better", () => {
    const score = quintileScorer(values, true);
    expect(score(10)).toBe(1);
    expect(score(100)).toBe(5);
  });

  it("ranks low values best for recency", () => {
    const score = quintileScorer(values, false);
    expect(score(10)).toBe(5);
    expect(score(100)).toBe(1);
  });
});
