import { describe, expect, it } from "vitest";
import { classifyAbc, summarizeAbc } from "./abcClassification";
import type { ProductSales } from "@ecommerce/contracts/products";

const product = (id: string, revenue: number, extra: Partial<ProductSales> = {}): ProductSales => ({
  productId: id,
  name: id,
  category: "Decoração",
  subcategory: null,
  brand: null,
  collection: null,
  units: 10,
  revenue,
  cost: revenue * 0.5,
  orders: 8,
  stockQty: 20,
  ...extra,
});

describe("classifyAbc", () => {
  const rows = classifyAbc(
    [
      product("p1", 500),
      product("p2", 300),
      product("p3", 150),
      product("p4", 50),
      product("p5", 0),
    ],
    30,
  );

  it("sorts by revenue and cuts at 80% and 95% of the cumulative share", () => {
    expect(rows.map((r) => [r.productId, r.abcClass])).toEqual([
      ["p1", "A"],
      ["p2", "A"],
      ["p3", "B"],
      ["p4", "C"],
      ["p5", "C"],
    ]);
  });

  it("derives share, profit, average price and margin", () => {
    const p1 = rows[0]!;
    expect(p1.revenueShare).toBe(50);
    expect(p1.profit).toBe(250);
    expect(p1.averagePrice).toBe(50);
    expect(p1.margin).toBe(50);
    expect(rows[4]!.averagePrice).toBe(0);
  });

  it("flags stock health from the window's velocity", () => {
    const [risk, empty, ok] = classifyAbc(
      [
        product("risk", 100, { units: 60, stockQty: 10 }),
        product("empty", 100, { stockQty: 0 }),
        product("ok", 100, { units: 3, stockQty: 50 }),
      ],
      30,
    );
    expect(risk!.stockHealth).toBe("risco");
    expect(empty!.stockHealth).toBe("sem-estoque");
    expect(ok!.stockHealth).toBe("ok");
  });
});

describe("summarizeAbc", () => {
  it("counts products and revenue per class", () => {
    const summary = summarizeAbc(
      classifyAbc([product("p1", 800), product("p2", 150), product("p3", 50)], 30),
    );
    expect(summary).toEqual([
      { abcClass: "A", products: 1, revenue: 800, revenueShare: 80 },
      { abcClass: "B", products: 1, revenue: 150, revenueShare: 15 },
      { abcClass: "C", products: 1, revenue: 50, revenueShare: 5 },
    ]);
  });
});
