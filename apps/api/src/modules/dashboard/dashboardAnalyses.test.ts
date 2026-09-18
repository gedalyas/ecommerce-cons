import { describe, expect, it } from "vitest";
import type { OrdersBucket } from "@ecommerce/contracts/orders";
import type { ProductSales } from "@ecommerce/contracts/products";
import {
  channelSplitOf,
  customerMixOf,
  funnelOf,
  paidMediaOf,
  topProductsOf,
} from "./dashboardAnalyses";

const ordersBucket = (bucket: string, ecommerce: number, marketplace: number): OrdersBucket => ({
  bucket,
  revenue: ecommerce + marketplace,
  orders: 2,
  captured: 0,
  capturedOrders: 0,
  cogs: 0,
  repeatOrders: 0,
  productRevenue: 0,
  items: 0,
  discounts: 0,
  shipping: 0,
  ecommerce: { orders: 1, revenue: ecommerce },
  marketplace: { orders: 1, revenue: marketplace },
});

const product = (name: string, revenue: number): ProductSales => ({
  productId: name,
  name,
  category: "c",
  subcategory: null,
  brand: null,
  collection: null,
  units: 1,
  revenue,
  cost: 0,
  orders: 1,
  stockQty: 0,
});

describe("dashboard analyses", () => {
  it("zero-fills the channel split for buckets without orders", () => {
    const rows = channelSplitOf(
      ["2026-09-01", "2026-09-02"],
      [ordersBucket("2026-09-02", 100, 40)],
    );
    expect(rows).toEqual([
      { bucket: "2026-09-01", ecommerce: 0, marketplace: 0 },
      { bucket: "2026-09-02", ecommerce: 100, marketplace: 40 },
    ]);
  });

  it("keeps the best sellers only, ignoring products without sales", () => {
    const products = [product("a", 5), product("b", 0), product("c", 50), product("d", 20)];
    expect(topProductsOf(products, 2).map((p) => p.name)).toEqual(["c", "d"]);
  });

  it("derives returning customers and never goes negative", () => {
    expect(customerMixOf({ customers: 10, newCustomers: 4 })).toEqual({
      newCustomers: 4,
      returningCustomers: 6,
    });
    expect(customerMixOf({ customers: 3, newCustomers: 5 }).returningCustomers).toBe(0);
  });

  it("builds the funnel with zeros when there is no traffic", () => {
    const steps = funnelOf(null, 7);
    expect(steps.map((s) => s.value)).toEqual([0, 0, 0, 0, 7]);
    expect(steps.map((s) => s.label)).toEqual([
      "Sessões",
      "Produto visto",
      "Carrinho",
      "Checkout",
      "Pedidos pagos",
    ]);
  });

  it("zero-fills paid media per bucket", () => {
    const rows = paidMediaOf(
      ["2026-09-01", "2026-09-02"],
      [
        {
          bucket: "2026-09-01",
          spend: 30,
          platformFee: 0,
          impressions: 0,
          clicks: 0,
          attributedRevenue: 90,
        },
      ],
    );
    expect(rows).toEqual([
      { bucket: "2026-09-01", spend: 30, attributedRevenue: 90 },
      { bucket: "2026-09-02", spend: 0, attributedRevenue: 0 },
    ]);
  });
});
