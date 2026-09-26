import { describe, expect, it } from "vitest";
import { SKIP_COLUMN, sampleValueOf, sourceOptionsOf, withColumn } from "./columnMappingView";

describe("sourceOptionsOf", () => {
  it("lists each named column once, as the API matches it", () => {
    expect(sourceOptionsOf(["Pedido", " ", "Data", "pedido "])).toEqual(["Pedido", "Data"]);
  });
});

describe("sampleValueOf", () => {
  const header = ["Pedido", "Cupom"];
  const sample = [
    ["#1", ""],
    ["#2", "INSTA10"],
  ];

  it("shows the first filled value under the chosen column", () => {
    expect(sampleValueOf(header, sample, "Cupom")).toBe("INSTA10");
    expect(sampleValueOf(header, sample, "Pedido")).toBe("#1");
    expect(sampleValueOf(header, sample, "cupom")).toBe("INSTA10");
  });

  it("is blank when nothing is chosen or the column is gone", () => {
    expect(sampleValueOf(header, sample, null)).toBe("");
    expect(sampleValueOf(header, sample, "Total")).toBe("");
  });
});

describe("withColumn", () => {
  it("sets a field's column and clears it when skipped", () => {
    const mapping = withColumn({ number: "Pedido" }, "placedAt", "Data");
    expect(mapping).toEqual({ number: "Pedido", placedAt: "Data" });
    expect(withColumn(mapping, "number", SKIP_COLUMN)).toEqual({ placedAt: "Data" });
  });
});
