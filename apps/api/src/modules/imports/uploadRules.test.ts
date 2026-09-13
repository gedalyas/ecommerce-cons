import { describe, expect, it } from "vitest";
import { extensionOf, fileTypeProblem } from "./uploadRules";

describe("fileTypeProblem", () => {
  it("accepts .csv with a csv mime, a text mime or no mime at all", () => {
    expect(fileTypeProblem("pedidos.csv", "text/csv")).toBeNull();
    expect(fileTypeProblem("PEDIDOS.CSV", "application/vnd.ms-excel")).toBeNull();
    expect(fileTypeProblem("pedidos.csv", undefined)).toBeNull();
    expect(fileTypeProblem("pedidos.csv", "")).toBeNull();
  });

  it("refuses other extensions and foreign mimes", () => {
    expect(fileTypeProblem("pedidos.xlsx", "text/csv")).toMatch(/\.csv/);
    expect(fileTypeProblem("pedidos.csv", "application/zip")).toMatch(/application\/zip/);
    expect(fileTypeProblem("pedidos", "text/csv")).toMatch(/\.csv/);
  });

  it("reads the extension case-insensitively", () => {
    expect(extensionOf("a.b.CSV")).toBe(".csv");
    expect(extensionOf("semextensao")).toBe("");
  });
});
