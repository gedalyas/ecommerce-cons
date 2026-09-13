import { describe, expect, it } from "vitest";
import {
  financialStatusOf,
  latestUpdatedAt,
  orderInputOf,
  provinceCodeOf,
  utmOf,
  type NuvemshopOrder,
} from "./nuvemshopOrders";

const order: NuvemshopOrder = {
  id: 91,
  number: 1234,
  created_at: "2026-09-05T13:20:00+0000",
  updated_at: "2026-09-06T08:00:00+0000",
  payment_status: "paid",
  status: "open",
  total: "279.70",
  subtotal: "259.80",
  discount: "10.00",
  promotional_discount: { total_discount_amount: "5.00" },
  shipping_cost_customer: "34.90",
  gateway: "mercadopago",
  payment_details: { method: "pix" },
  customer: { name: " Ana Lima ", email: "Ana@Exemplo.com" },
  shipping_address: { city: "Curitiba", province: "Paraná" },
  products: [
    {
      product_id: 1,
      variant_id: 11,
      sku: "MANTA-AZ",
      name: "Manta azul",
      quantity: 2,
      price: "129.90",
    },
    { product_id: 2, variant_id: 22, sku: "", name: "Brinde", quantity: "1", price: "0" },
  ],
  coupon: [{ code: "insta10" }],
  landing_url: "https://loja.com/?utm_source=meta&utm_medium=paid-social&utm_campaign=lanc",
};

describe("orderInputOf", () => {
  it("maps a paid order with items, coupons, UTMs and the province code", () => {
    const input = orderInputOf(order);
    expect(input).toMatchObject({
      number: "#1234",
      placedAt: "2026-09-05",
      status: "PAID",
      email: "ana@exemplo.com",
      customerName: "Ana Lima",
      city: "Curitiba",
      province: "PR",
      channel: "Nuvemshop",
      gateway: "mercadopago",
      processingMethod: "PIX",
      utmSource: "meta",
      utmMedium: "paid-social",
      utmCampaign: "lanc",
      coupons: ["INSTA10"],
      shipping: 34.9,
      discount: 15,
      productRevenue: 259.8,
      totalPrice: 279.7,
    });
    expect(input?.items).toEqual([
      {
        sku: "MANTA-AZ",
        productName: "Manta azul",
        category: "Sem categoria",
        quantity: 2,
        unitPrice: 129.9,
        unitCost: null,
      },
      {
        sku: "NS-22",
        productName: "Brinde",
        category: "Sem categoria",
        quantity: 1,
        unitPrice: 0,
        unitCost: null,
      },
    ]);
  });
  it("drops orders without e-mail, date or items", () => {
    expect(orderInputOf({ ...order, customer: { email: "" } })).toBeNull();
    expect(orderInputOf({ ...order, created_at: null })).toBeNull();
    expect(orderInputOf({ ...order, products: [] })).toBeNull();
  });
});

describe("helpers", () => {
  it("maps payment and order statuses", () => {
    expect(financialStatusOf({ payment_status: "pending" })).toBe("PENDING");
    expect(financialStatusOf({ payment_status: "refunded" })).toBe("REFUNDED");
    expect(financialStatusOf({ payment_status: "paid", status: "cancelled" })).toBe("CANCELLED");
    expect(financialStatusOf({ payment_status: "weird" })).toBe("PENDING");
  });
  it("turns province names or codes into UF", () => {
    expect(provinceCodeOf("São Paulo")).toBe("SP");
    expect(provinceCodeOf("rs")).toBe("RS");
    expect(provinceCodeOf("Marte")).toBe("ND");
    expect(provinceCodeOf(null)).toBe("ND");
  });
  it("reads UTMs and tolerates a bad URL", () => {
    expect(utmOf("nope").utmSource).toBeNull();
    expect(utmOf("/?utm_source=google").utmSource).toBe("google");
  });
  it("keeps the latest updated_at as the cursor", () => {
    expect(
      latestUpdatedAt([{ updated_at: "2026-01-01" }, { updated_at: "2026-02-01" }], "2025-12-31"),
    ).toBe("2026-02-01");
    expect(latestUpdatedAt([], "2025-12-31")).toBe("2025-12-31");
  });
});
