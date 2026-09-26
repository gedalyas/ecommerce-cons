import { describe, expect, it } from "vitest";
import { formatFileSize, importFileProblem } from "./importFile";

describe("importFileProblem", () => {
  it("accepts a small csv and refuses the rest with a Portuguese message", () => {
    expect(importFileProblem("pedidos.csv", 1024)).toBeNull();
    expect(importFileProblem("pedidos.CSV", 1024)).toBeNull();
    expect(importFileProblem("pedidos.xlsx", 1024)).toBeNull();
    expect(importFileProblem("pedidos.xls", 1024)).toMatch(/\.csv, \.xlsx/);
    expect(importFileProblem("pedidos.csv", 11 * 1024 * 1024)).toMatch(/10 MB/);
    expect(importFileProblem("pedidos.csv", 0)).toMatch(/vazio/);
  });
});

describe("formatFileSize", () => {
  it("picks the unit", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(20 * 1024)).toBe("20 KB");
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe("1,5 MB");
  });
});
