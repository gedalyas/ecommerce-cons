import { describe, expect, it } from "vitest";
import { productPerformance, type ItemSums } from "./productPerformance";

const item = (productId: string | null, views: number): ItemSums => ({
  key: productId ?? "item:orphan",
  productId,
  name: `Produto ${productId ?? "sem cadastro"}`,
  views,
  addToCart: views / 10,
  purchases: views / 50,
});

describe("productPerformance", () => {
  it("puts GA4 behaviour beside the site sales of the same product", () => {
    const [matched] = productPerformance(
      [item("p1", 1000)],
      [{ productId: "p1", units: 30, revenue: 6000 }],
    );
    expect(matched).toMatchObject({
      key: "p1",
      cartRate: 10,
      purchaseRate: 2,
      units: 30,
      revenue: 6000,
    });
    expect(matched).not.toHaveProperty("productId");
  });

  it("shows zero for a known product without site sales and dashes for an unmatched item", () => {
    const [known, orphan] = productPerformance([item("p2", 500), item(null, 100)], []);
    expect(known).toMatchObject({ units: 0, revenue: 0 });
    expect(orphan).toMatchObject({ units: null, revenue: null });
  });

  it("has no rates for an item nobody viewed", () => {
    expect(productPerformance([item("p1", 0)], [])[0]).toMatchObject({
      cartRate: null,
      purchaseRate: null,
    });
  });
});
