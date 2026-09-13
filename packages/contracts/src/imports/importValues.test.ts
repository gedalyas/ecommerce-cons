import { describe, expect, it } from "vitest";
import {
  normalizeHeader,
  parseImportDate,
  parseImportInteger,
  parseImportNumber,
  parseImportOption,
} from "./importValues";

describe("parseImportDate", () => {
  it("accepts Brazilian and ISO dates and rejects impossible days", () => {
    expect(parseImportDate("05/09/2026")).toBe("2026-09-05");
    expect(parseImportDate("5/9/2026")).toBe("2026-09-05");
    expect(parseImportDate("2026-09-05")).toBe("2026-09-05");
    expect(parseImportDate("2026-09-05T10:00:00Z")).toBe("2026-09-05");
    expect(parseImportDate("31/02/2026")).toBeNull();
    expect(parseImportDate("ontem")).toBeNull();
  });
});

describe("parseImportNumber", () => {
  it("reads pt-BR and plain numbers", () => {
    expect(parseImportNumber("1.234,56")).toBe(1234.56);
    expect(parseImportNumber("R$ 19,90")).toBe(19.9);
    expect(parseImportNumber("1234.56")).toBe(1234.56);
    expect(parseImportNumber("1,234.56")).toBe(1234.56);
    expect(parseImportNumber("12")).toBe(12);
    expect(parseImportNumber("")).toBeNull();
    expect(parseImportNumber("abc")).toBeNull();
  });

  it("requires whole numbers for integers", () => {
    expect(parseImportInteger("340")).toBe(340);
    expect(parseImportInteger("3,5")).toBeNull();
  });
});

describe("parseImportOption", () => {
  it("matches options ignoring case", () => {
    expect(parseImportOption("PIX", ["cartao", "pix", "boleto"])).toBe("pix");
    expect(parseImportOption("cheque", ["cartao", "pix", "boleto"])).toBeNull();
  });
});

describe("normalizeHeader", () => {
  it("strips the BOM, accents and case", () => {
    expect(normalizeHeader("﻿Número ")).toBe("numero");
    expect(normalizeHeader("Preço Unitário")).toBe("preco_unitario");
    expect(normalizeHeader("utm-source")).toBe("utm_source");
  });
});
