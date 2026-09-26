import { describe, expect, it } from "vitest";
import { columnLabelOf, looksLikeData, maskCell, maskedSample } from "./sampleMask";

describe("maskCell", () => {
  it("keeps what tells a column's type and names nobody", () => {
    expect(maskCell("20/09/2026")).toBe("20/09/2026");
    expect(maskCell("2026-09-20 14:30")).toBe("2026-09-20 14:30");
    expect(maskCell("1.234,50")).toBe("1.234,50");
    expect(maskCell("R$ 99,90")).toBe("R$ 99,90");
    expect(maskCell("#10432")).toBe("#10432");
    expect(maskCell("AUR-114-AZ-M")).toBe("AUR-114-AZ-M");
    expect(maskCell("pago")).toBe("pago");
    expect(maskCell("Marketplace")).toBe("Marketplace");
    expect(maskCell("cpc")).toBe("cpc");
  });

  it.each([
    ["ana souza", "aaa aaaaa"],
    ["maria", "aaaaa"],
    ["ANA SOUZA", "AAA AAAAA"],
    ["Ana Souza (VIP)", "Aaa Aaaaa (AAA)"],
    ["Souza, Ana", "Aaaaa, Aaa"],
    ["Rua das Flores, 123 - Ap 4", "Aaa aaa Aaaaaa, 000 - Aa 0"],
    ["ana.souza@gmail.com", "aaa.aaaaa@aaaaa.aaa"],
    ["ana [at] gmail.com", "aaa [aa] aaaaa.aaa"],
    ["123.456.789-09", "000.000.000-00"],
    ["12345678909", "00000000000"],
    ["CPF 123.456.789-09", "AAA 000.000.000-00"],
    ["Tel: (11) 98765-4321", "Aaa: (00) 00000-0000"],
    ["20/09/2026 Ana Souza", "00/00/0000 Aaa Aaaaa"],
    ["Presente p/ Ana, Rua X 12", "Aaaaaaaa a/ Aaa, Aaa A 00"],
  ])("hides %s", (raw, masked) => {
    expect(maskCell(raw)).toBe(masked);
  });

  it("cuts long cells", () => {
    expect(maskCell("x".repeat(100))).toHaveLength(60);
  });
});

describe("looksLikeData", () => {
  it("tells a data row from a row of labels", () => {
    expect(looksLikeData("Data da compra")).toBe(false);
    expect(looksLikeData("Nome do cliente")).toBe(false);
    expect(looksLikeData("ana@x.com")).toBe(true);
    expect(looksLikeData("20/09/2026")).toBe(true);
    expect(looksLikeData("123.456.789-09")).toBe(true);
    expect(looksLikeData("99,90")).toBe(true);
  });
});

describe("columnLabelOf", () => {
  it("trims and cuts a column name", () => {
    expect(columnLabelOf(`  ${"x".repeat(80)}`)).toHaveLength(60);
  });
});

describe("maskedSample", () => {
  it("keeps the first rows, the header's width and a size budget", () => {
    const rows = [
      ["Ana", "a@b.co", "extra"],
      ["Bia", "c@d.co", "extra"],
      ["Caio", "e@f.co", "extra"],
    ];
    expect(maskedSample(rows, 2, 2, 10_000)).toEqual([
      ["Aaa", "a@a.aa"],
      ["Aaa", "a@a.aa"],
    ]);
    expect(maskedSample(rows, 2, 3, 20)).toHaveLength(1);
  });
});
