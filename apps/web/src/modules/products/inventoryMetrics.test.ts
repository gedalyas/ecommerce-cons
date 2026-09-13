import { describe, expect, it } from "vitest";
import { deriveInventory, inventoryHealth, type InventoryFacts } from "./inventoryMetrics";

const facts = (overrides: Partial<InventoryFacts> = {}): InventoryFacts => ({
  variantId: "v1",
  productName: "Vaso",
  variantName: "Areia",
  sku: "AUR-101",
  category: "Decoração",
  subcategory: "Vasos",
  brand: "Aurora",
  collection: null,
  stockQty: 30,
  price: 100,
  cost: 50,
  lastSaleAt: "2026-09-09T12:00:00.000Z",
  soldTotal: 400,
  sold90: 180,
  sold30: 60,
  sold7: 14,
  ...overrides,
});

describe("deriveInventory", () => {
  it("projects days to zero and the stock-out date from the 30-day pace", () => {
    const row = deriveInventory(facts(), "2026-09-10");
    expect(row.velocity).toBe(2);
    expect(row.daysToZero).toBe(15);
    expect(row.stockOutDate).toBe("2026-09-25");
    expect(row.stockValue).toBe(1500);
    expect(row.revenuePotential).toBe(3000);
    expect(row.daysOutOfStock).toBeNull();
    expect(row.lostRevenueSinceStockOut).toBeNull();
  });

  it("falls back to the 90-day pace when the last 30 days sold nothing", () => {
    expect(deriveInventory(facts({ sold30: 0, sold90: 90 }), "2026-09-10").velocity).toBe(1);
  });

  it("prices a stock-out: lost revenue since the last sale and cost per day", () => {
    const row = deriveInventory(
      facts({ stockQty: 0, lastSaleAt: "2026-09-01T00:00:00.000Z" }),
      "2026-09-10",
    );
    expect(row.daysToZero).toBeNull();
    expect(row.daysOutOfStock).toBe(9);
    expect(row.lostRevenueSinceStockOut).toBe(1800);
    expect(row.stockOutCostPerDay).toBe(100);
  });

  it("leaves cost-based figures null when the cost is unknown", () => {
    const row = deriveInventory(facts({ cost: null, stockQty: 0 }), "2026-09-10");
    expect(row.stockValue).toBeNull();
    expect(row.stockOutCostPerDay).toBeNull();
  });
});

describe("inventoryHealth", () => {
  it("summarises rupture and coverage across variants", () => {
    const rows = [
      deriveInventory(facts({ variantId: "a", stockQty: 30 }), "2026-09-10"),
      deriveInventory(facts({ variantId: "b", stockQty: 0 }), "2026-09-10"),
      deriveInventory(facts({ variantId: "c", stockQty: 10, sold30: 30 }), "2026-09-10"),
    ];
    const health = inventoryHealth(rows);
    expect(health.variants).toBe(3);
    expect(health.outOfStock).toBe(1);
    expect(health.stockOutRate).toBeCloseTo(33.33, 2);
    expect(health.coverageDays).toBe(8);
  });
});
