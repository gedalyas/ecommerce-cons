import { describe, expect, it } from "vitest";
import type { OrderInput } from "./importRows.types";
import { orderRowOf } from "./orderRow";

const order: OrderInput = {
  number: "#1",
  placedAt: "2026-09-05",
  status: "PAID",
  email: "a@b.c",
  customerName: "Ana",
  city: "Curitiba",
  province: "PR",
  salesPlatform: "ECOMMERCE",
  channel: "Loja",
  gateway: "Pagar.me",
  processingMethod: "PIX",
  utmSource: "meta",
  utmMedium: null,
  utmCampaign: null,
  coupons: ["INSTA10"],
  shipping: 19.9,
  discount: 10,
  rows: [2, 3],
  items: [
    { sku: "A", productName: "P", category: "C", quantity: 2, unitPrice: 50, unitCost: null },
    { sku: "B", productName: "Q", category: "C", quantity: 1, unitPrice: 20, unitCost: 5 },
  ],
  productRevenue: 120,
  totalPrice: 129.9,
};

describe("orderRowOf", () => {
  it("maps the mapped order to the row, paid on the same day when paid", () => {
    const row = orderRowOf(order, "cust-1", 3);
    expect(row.placedAt.toISOString()).toBe("2026-09-05T12:00:00.000Z");
    expect(row.paidAt).toEqual(row.placedAt);
    expect(row).toMatchObject({
      customerId: "cust-1",
      financialStatus: "PAID",
      paymentGateway: "Pagar.me",
      shippingRevenue: 19.9,
      totalDiscounts: 10,
      discountCodes: ["INSTA10"],
      orderNumberForCustomer: 3,
      itemsCount: 3,
    });
  });
  it("leaves paidAt empty for an unpaid order", () => {
    expect(orderRowOf({ ...order, status: "PENDING" }, "c", 1).paidAt).toBeNull();
  });
});
