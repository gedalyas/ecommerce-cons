import { describe, expect, it } from "vitest";
import {
  mercadoLivreBuyerEmailOf,
  mercadoLivreMethodOf,
  mercadoLivreOrderInputOf,
  mercadoLivreProvinceOf,
  mercadoLivreStatusOf,
  type MercadoLivreOrder,
} from "./mercadoLivreOrders";

const order: MercadoLivreOrder = {
  id: 2000001,
  status: "paid",
  date_created: "2026-09-02T14:30:00.000-03:00",
  last_updated: "2026-09-02T15:00:00.000-03:00",
  total_amount: 250,
  coupon: { amount: 10, id: "promo10" },
  buyer: { id: 77, nickname: "COMPRADOR77", first_name: "Ana", last_name: "Souza" },
  payments: [{ status: "approved", payment_type: "credit_card", shipping_cost: 20 }],
  order_items: [
    { item: { id: "MLB1", title: "Caneca", seller_sku: "CAN-01" }, quantity: 2, unit_price: 100 },
    { item: { id: "MLB2", title: "Adesivo" }, quantity: 1, unit_price: 50 },
  ],
  shipment: { receiver_address: { city: { name: "Curitiba" }, state: { id: "BR-PR" } } },
};

describe("mercadoLivreOrderInputOf", () => {
  it("maps a paid order with shipment, coupon and synthetic buyer e-mail", () => {
    const input = mercadoLivreOrderInputOf(order);
    expect(input).toMatchObject({
      number: "ML-2000001",
      placedAt: "2026-09-02",
      status: "PAID",
      email: "77@comprador.mercadolivre.com.br",
      customerName: "Ana Souza",
      city: "Curitiba",
      province: "PR",
      salesPlatform: "MARKETPLACE",
      channel: "Mercado Livre",
      gateway: "Mercado Pago",
      processingMethod: "CREDIT_CARD",
      coupons: ["PROMO10"],
      shipping: 20,
      discount: 10,
      productRevenue: 250,
      totalPrice: 260,
    });
    expect(input?.items.map((i) => i.sku)).toEqual(["CAN-01", "MLB2"]);
  });

  it("returns null without a buyer or without items", () => {
    expect(mercadoLivreOrderInputOf({ ...order, buyer: null })).toBeNull();
    expect(mercadoLivreOrderInputOf({ ...order, order_items: [] })).toBeNull();
  });

  it("prefers the buyer e-mail when the API sends one", () => {
    expect(mercadoLivreBuyerEmailOf({ id: 1, email: " Ana@Loja.com " })).toBe("ana@loja.com");
    expect(mercadoLivreBuyerEmailOf(null)).toBeNull();
  });
});

describe("mercadoLivreStatusOf", () => {
  it("maps the marketplace statuses onto the financial ones", () => {
    expect(mercadoLivreStatusOf({ id: 1, status: "paid" })).toBe("PAID");
    expect(mercadoLivreStatusOf({ id: 1, status: "payment_required" })).toBe("PENDING");
    expect(mercadoLivreStatusOf({ id: 1, status: "cancelled" })).toBe("CANCELLED");
    expect(mercadoLivreStatusOf({ id: 1, status: "unknown" })).toBe("PENDING");
  });

  it("marks refunded when any payment was refunded", () => {
    expect(
      mercadoLivreStatusOf({ id: 1, status: "paid", payments: [{ status: "refunded" }] }),
    ).toBe("REFUNDED");
  });
});

describe("mercadoLivreMethodOf and province", () => {
  it("maps payment types", () => {
    expect(mercadoLivreMethodOf({ id: 1, payments: [{ payment_type: "ticket" }] })).toBe("BOLETO");
    expect(mercadoLivreMethodOf({ id: 1, payments: [{ payment_type: "account_money" }] })).toBe(
      "PIX",
    );
    expect(mercadoLivreMethodOf({ id: 1 })).toBe("CREDIT_CARD");
  });

  it("reads the UF from the BR-XX state id", () => {
    expect(mercadoLivreProvinceOf({ receiver_address: { state: { id: "br-sp" } } })).toBe("SP");
    expect(mercadoLivreProvinceOf(null)).toBe("ND");
  });
});
