import { describe, expect, it } from "vitest";
import {
  headerProblem,
  isTemplateLayout,
  layoutKeyOf,
  mappingProblems,
  mappingSampleOf,
  remapTable,
  suggestMapping,
} from "./columnMapping";

const shopHeader = [
  "Pedido",
  "Data da compra",
  "Situação",
  "E-mail",
  "Nome do cliente",
  "Código",
  "Descrição",
  "Qtd",
  "Preço",
  "Observação",
];

describe("layoutKeyOf", () => {
  it("ignores order, case, accents and blank columns", () => {
    expect(layoutKeyOf(["Situação", "Pedido", ""])).toBe(layoutKeyOf(["pedido", " SITUACAO "]));
    expect(layoutKeyOf(["Pedido"])).not.toBe(layoutKeyOf(["Pedido", "Data"]));
  });
});

describe("isTemplateLayout", () => {
  it("is the template when every required header is present", () => {
    expect(isTemplateLayout("TRAFFIC", ["data", "origem", "meio", "sessoes", "extra"])).toBe(true);
    expect(isTemplateLayout("TRAFFIC", ["data", "origem", "sessoes"])).toBe(false);
  });
});

describe("suggestMapping", () => {
  it("maps a free layout through the synonyms", () => {
    expect(suggestMapping("ORDERS", shopHeader)).toEqual({
      number: "Pedido",
      placedAt: "Data da compra",
      status: "Situação",
      email: "E-mail",
      customerName: "Nome do cliente",
      sku: "Código",
      productName: "Descrição",
      quantity: "Qtd",
      unitPrice: "Preço",
    });
  });

  it("prefers the template's own header and never uses a column twice", () => {
    const mapping = suggestMapping("ORDERS", ["cliente", "cliente_nome"]);
    expect(mapping["customerName"]).toBe("cliente_nome");
    expect(Object.values(mapping)).toEqual(["cliente_nome"]);
  });
});

describe("mappingProblems", () => {
  it("accepts a complete mapping", () => {
    expect(mappingProblems("ORDERS", shopHeader, suggestMapping("ORDERS", shopHeader))).toEqual([]);
  });

  it("names unknown fields, absent columns and unmapped required fields", () => {
    expect(
      mappingProblems("TRAFFIC", ["Dia", "Fonte", "Meio"], {
        date: "Dia",
        source: "Fonte",
        medium: "Canal",
        bogus: "Dia",
      }),
    ).toEqual([
      "Campo desconhecido: bogus.",
      'A coluna "Canal" não está na planilha.',
      'Escolha a coluna de "sessoes".',
    ]);
  });
});

describe("remapTable", () => {
  it("rewrites the rows in the template's layout, dropping unmapped columns", () => {
    expect(
      remapTable(
        "TRAFFIC",
        ["Visitas", "Obs", "Dia", "Fonte", "Meio"],
        [["10", "x", "05/09/2026", "google", "cpc"]],
        {
          date: "Dia",
          source: "Fonte",
          medium: "Meio",
          sessions: "Visitas",
        },
      ),
    ).toEqual({
      header: ["data", "origem", "meio", "sessoes"],
      rows: [["05/09/2026", "google", "cpc", "10"]],
    });
  });
});

describe("headerProblem", () => {
  it("refuses a header too wide or a column name too long", () => {
    expect(headerProblem(["Pedido", "Data"])).toBeNull();
    expect(headerProblem(Array.from({ length: 201 }, (_, i) => `c${i}`))).toBe(
      "A planilha tem mais de 200 colunas.",
    );
    expect(headerProblem(["x".repeat(201)])).toBe("Um nome de coluna passa de 200 caracteres.");
  });
});

describe("mappingSampleOf", () => {
  it("keeps the first rows with each cell cut to the header length", () => {
    const rows = Array.from({ length: 8 }, (_, i) => [String(i), "y".repeat(300)]);
    const sample = mappingSampleOf(rows);
    expect(sample).toHaveLength(5);
    expect(sample[0]?.[1]).toHaveLength(200);
  });
});
