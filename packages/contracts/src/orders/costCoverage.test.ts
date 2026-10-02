import { describe, expect, it } from "vitest";
import { costCoverage, costCoverageNotice, knownCogs } from "./costCoverage";

describe("costCoverage", () => {
  it("is the share of item revenue whose cost is known", () => {
    expect(costCoverage(250, 1000)).toBe(25);
    expect(costCoverage(1000, 1000)).toBe(100);
  });

  it("is null when nothing was sold", () => {
    expect(costCoverage(0, 0)).toBeNull();
  });

  it("stays between 0 and 100", () => {
    expect(costCoverage(1200, 1000)).toBe(100);
    expect(costCoverage(-5, 1000)).toBe(0);
  });
});

describe("knownCogs", () => {
  it("treats a coverage under 90% as unknown", () => {
    expect(knownCogs(0, 0)).toBeNull();
    expect(knownCogs(300, 1)).toBeNull();
    expect(knownCogs(300, 89.9)).toBeNull();
  });

  it("keeps the known cost from 90% up and when nothing was sold", () => {
    expect(knownCogs(300, 90)).toBe(300);
    expect(knownCogs(300, 95)).toBe(300);
    expect(knownCogs(0, null)).toBe(0);
  });
});

describe("costCoverageNotice", () => {
  it("asks for the cost when none is known", () => {
    expect(costCoverageNotice(0)).toMatch(/^Nenhum produto.*Cadastre o custo/);
  });

  it("asks for the rest when too little is known", () => {
    expect(costCoverageNotice(40)).toMatch(/^Só 40%.*Cadastre o custo dos demais/);
  });

  it("warns that a nearly complete cost is slightly understated", () => {
    expect(costCoverageNotice(96.7)).toMatch(/^96% .*um pouco abaixo/);
  });

  it("stays quiet with full coverage or no sales", () => {
    expect(costCoverageNotice(100)).toBeNull();
    expect(costCoverageNotice(null)).toBeNull();
  });
});
