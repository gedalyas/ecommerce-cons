import { describe, expect, it } from "vitest";
import type { OrdersAggregate } from "@ecommerce/contracts/orders";
import { computeOrdersSummary } from "./ordersSummaryMetrics";

const aggregate: OrdersAggregate = {
  revenue: 90_000,
  orders: 300,
  captured: 100_000,
  capturedOrders: 340,
  cogs: 45_000,
  costCoverage: 100,
  repeatOrders: 45,
  productRevenue: 92_000,
  items: 510,
  discounts: 6_000,
  shipping: 4_500,
  ecommerce: { orders: 240, revenue: 72_000 },
  marketplace: { orders: 60, revenue: 18_000 },
};

describe("computeOrdersSummary", () => {
  const s = computeOrdersSummary(aggregate);

  it("derives the approval rate from paid over captured revenue", () => {
    expect(s.captured).toBe(100_000);
    expect(s.revenue).toBe(90_000);
    expect(s.approvalRate).toBe(90);
  });

  it("derives per-order figures from paid orders", () => {
    expect(s.orders).toBe(300);
    expect(s.averageTicket).toBe(300);
    expect(s.itemsPerOrder).toBe(1.7);
    expect(s.discountPerOrder).toBe(20);
    expect(s.discounts).toBe(6_000);
    expect(s.shipping).toBe(4_500);
  });

  it("returns null ratios for an empty window", () => {
    const empty = computeOrdersSummary({ ...aggregate, revenue: 0, orders: 0, captured: 0 });
    expect(empty.approvalRate).toBeNull();
    expect(empty.averageTicket).toBeNull();
    expect(empty.itemsPerOrder).toBeNull();
  });
});
