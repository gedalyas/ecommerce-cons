import { describe, expect, it } from "vitest";
import { blingProductRows, productsDue, skuCategories, type BlingProduct } from "./blingProducts";

const blingProductRowOf = (p: BlingProduct, category: string | null) =>
  blingProductRows([p], new Map(category ? [[p.codigo?.trim() ?? "", category]] : []))[0] ?? null;

const product = (extra: Partial<BlingProduct> = {}): BlingProduct => ({
  id: 40,
  codigo: "BL-CANECA",
  nome: "Caneca Bling",
  preco: "79.90",
  precoCusto: 31.5,
  estoque: { saldoVirtualTotal: 12 },
  ...extra,
});

describe("blingProductRowOf", () => {
  it("maps SKU, name, cost, price, stock and the given category", () => {
    expect(blingProductRowOf(product(), "Canecas")).toEqual({
      row: 0,
      sku: "BL-CANECA",
      name: "Caneca Bling",
      category: "Canecas",
      cost: 31.5,
      stock: 12,
      price: 79.9,
    });
  });

  it("treats a zero cost or price as not informed", () => {
    const row = blingProductRowOf(product({ precoCusto: 0, preco: "0" }), null);
    expect(row?.cost).toBeNull();
    expect(row?.price).toBeNull();
  });

  it("keeps a missing balance unknown and rounds a fractional one", () => {
    expect(blingProductRowOf(product({ estoque: null }), null)?.stock).toBeNull();
    expect(blingProductRowOf(product({ estoque: { saldoVirtualTotal: "2.6" } }), null)?.stock).toBe(
      3,
    );
  });

  it("leaves values the columns cannot hold unknown", () => {
    const row = blingProductRowOf(
      product({ preco: 1e12, precoCusto: "1e15", estoque: { saldoVirtualTotal: 3e9 } }),
      null,
    );
    expect(row).toMatchObject({ price: null, cost: null, stock: null });
  });

  it("caps a long name", () => {
    expect(blingProductRowOf(product({ nome: "x".repeat(300) }), null)?.name).toHaveLength(200);
  });

  it("skips a product without SKU", () => {
    expect(blingProductRowOf(product({ codigo: " " }), null)).toBeNull();
  });
});

describe("skuCategories", () => {
  it("names each SKU after the category it was listed under", () => {
    const map = skuCategories([
      { category: { id: 7, descricao: " Canecas " }, products: [product()] },
      { category: { id: 8, descricao: "" }, products: [product({ codigo: "COPO" })] },
    ]);
    expect([...map]).toEqual([["BL-CANECA", "Canecas"]]);
  });
});

describe("blingProductRows", () => {
  it("drops products without SKU, keeps the last of a repeated SKU and adds the category", () => {
    const rows = blingProductRows(
      [product({ precoCusto: 10 }), product({ codigo: "" }), product({ precoCusto: 12 })],
      new Map([["BL-CANECA", "Canecas"]]),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ cost: 12, category: "Canecas" });
  });
});

describe("productsDue", () => {
  const now = new Date("2026-10-02T12:00:00.000Z");

  it("pulls the catalog on the first sync and then every six hours", () => {
    expect(productsDue(undefined, now)).toBe(true);
    expect(productsDue("2026-10-02T07:00:00.000Z", now)).toBe(false);
    expect(productsDue("2026-10-02T06:00:00.000Z", now)).toBe(true);
  });
});
