import { describe, expect, it } from "vitest";
import {
  amazonBuyerEmailOf,
  amazonMethodOf,
  amazonOrderInputOf,
  amazonProvinceOf,
  amazonFulfillmentOf,
  type AmazonOrder,
} from "./amazonOrders";

const order: AmazonOrder = {
  AmazonOrderId: "701-1234567-0000001",
  PurchaseDate: "2026-09-03T18:20:00Z",
  LastUpdateDate: "2026-09-04T10:00:00Z",
  OrderStatus: "Shipped",
  OrderTotal: { CurrencyCode: "BRL", Amount: "215.00" },
  PaymentMethod: "Other",
  PaymentMethodDetails: ["CreditCard"],
  ShippingAddress: { City: "Campinas", StateOrRegion: "São Paulo", CountryCode: "BR" },
  items: [
    {
      ASIN: "B0ABC",
      SellerSKU: "AMZ-CANECA",
      Title: "Caneca",
      QuantityOrdered: 2,
      ItemPrice: { Amount: "180.00" },
      ShippingPrice: { Amount: "35.00" },
      PromotionDiscount: { Amount: "0.00" },
    },
  ],
};

describe("amazonOrderInputOf", () => {
  it("maps a shipped order with per-unit price, shipping from items and UF from the state name", () => {
    const input = amazonOrderInputOf(order);
    expect(input).toMatchObject({
      number: "701-1234567-0000001",
      placedAt: "2026-09-03",
      status: "PAID",
      email: "701-1234567-0000001@comprador.amazon.com.br",
      customerName: "Comprador Amazon",
      city: "Campinas",
      province: "SP",
      salesPlatform: "MARKETPLACE",
      channel: "Amazon",
      gateway: "Amazon Pay",
      processingMethod: "CREDIT_CARD",
      shipping: 35,
      discount: 0,
      productRevenue: 180,
      totalPrice: 215,
    });
    expect(input?.items[0]).toMatchObject({ sku: "AMZ-CANECA", quantity: 2, unitPrice: 90 });
  });

  it("returns null without a purchase date or items", () => {
    expect(amazonOrderInputOf({ ...order, PurchaseDate: null })).toBeNull();
    expect(amazonOrderInputOf({ ...order, items: [] })).toBeNull();
  });

  it("maps statuses", () => {
    expect(amazonOrderInputOf({ ...order, OrderStatus: "Pending" })?.status).toBe("PENDING");
    expect(amazonOrderInputOf({ ...order, OrderStatus: "Canceled" })?.status).toBe("CANCELLED");
    expect(amazonOrderInputOf({ ...order, OrderStatus: "Unshipped" })?.status).toBe("PAID");
  });

  it("uses the buyer e-mail and name when the restricted data is present", () => {
    const withBuyer = { ...order, BuyerInfo: { BuyerEmail: "X@Y.com", BuyerName: "Bia" } };
    expect(amazonBuyerEmailOf(withBuyer)).toBe("x@y.com");
    expect(amazonOrderInputOf(withBuyer)?.customerName).toBe("Bia");
  });
});

describe("amazonProvinceOf and amazonMethodOf", () => {
  it("accepts UF codes and state names with accents", () => {
    expect(amazonProvinceOf("sp")).toBe("SP");
    expect(amazonProvinceOf("Paraná")).toBe("PR");
    expect(amazonProvinceOf("Distrito Federal")).toBe("DF");
    expect(amazonProvinceOf(undefined)).toBe("ND");
  });

  it("maps payment details", () => {
    expect(amazonMethodOf(["Pix"])).toBe("PIX");
    expect(amazonMethodOf(["Boleto"])).toBe("BOLETO");
    expect(amazonMethodOf(null)).toBe("CREDIT_CARD");
  });
});

describe("amazonFulfillmentOf", () => {
  it("reads FBA from the order's fulfillment channel", () => {
    expect(amazonFulfillmentOf("AFN")).toBe("MARKETPLACE");
    expect(amazonFulfillmentOf("MFN")).toBe("SELLER");
    expect(amazonFulfillmentOf(undefined)).toBeNull();
  });
});
