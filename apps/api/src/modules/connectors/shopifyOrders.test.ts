import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  shopDomainOf,
  shopifyMethodOf,
  shopifyOrderInputOf,
  verifyShopifyHmac,
} from "./shopifyOrders";

const money = (amount: string) => ({ shopMoney: { amount } });

describe("shopifyOrderInputOf", () => {
  it("maps a GraphQL order node", () => {
    const input = shopifyOrderInputOf({
      id: "gid://shopify/Order/1001",
      name: "#1001",
      createdAt: "2026-09-04T13:00:00Z",
      displayFinancialStatus: "PAID",
      currentTotalPriceSet: money("289.80"),
      totalDiscountsSet: money("10.00"),
      totalShippingPriceSet: money("40.00"),
      paymentGatewayNames: ["Mercado Pago PIX"],
      discountCodes: ["insta10"],
      customer: { email: "Ana@Loja.com", displayName: "Ana Lima" },
      shippingAddress: { city: "Recife", provinceCode: "PE" },
      customerJourneySummary: {
        firstVisit: { utmParameters: { source: "meta", medium: "paid-social", campaign: null } },
      },
      lineItems: {
        nodes: [
          {
            sku: "MANTA-AZ",
            title: "Manta azul",
            quantity: 2,
            originalUnitPriceSet: money("129.90"),
            variant: {
              id: "gid://shopify/ProductVariant/7",
              product: { productType: "Decoração" },
            },
          },
        ],
      },
    });
    expect(input).toMatchObject({
      number: "#1001",
      placedAt: "2026-09-04",
      status: "PAID",
      email: "ana@loja.com",
      customerName: "Ana Lima",
      province: "PE",
      gateway: "Mercado Pago PIX",
      processingMethod: "PIX",
      utmSource: "meta",
      coupons: ["INSTA10"],
      shipping: 40,
      discount: 10,
      productRevenue: 259.8,
      totalPrice: 289.8,
    });
    expect(input?.items[0]?.category).toBe("Decoração");
  });
  it("marks cancelled orders and drops orders without e-mail", () => {
    const base = {
      id: "gid://shopify/Order/2",
      createdAt: "2026-09-04T13:00:00Z",
      customer: { email: "a@b.c" },
      lineItems: { nodes: [{ sku: "X", quantity: 1, originalUnitPriceSet: money("1") }] },
    };
    expect(shopifyOrderInputOf({ ...base, cancelledAt: "2026-09-05T00:00:00Z" })?.status).toBe(
      "CANCELLED",
    );
    expect(shopifyOrderInputOf({ ...base, customer: null })).toBeNull();
    expect(shopifyMethodOf(["Boleto Bancário"])).toBe("BOLETO");
  });
});

describe("shop domain and hmac", () => {
  it("normalises the shop domain", () => {
    expect(shopDomainOf("minhaloja")).toBe("minhaloja.myshopify.com");
    expect(shopDomainOf("https://Minha-Loja.myshopify.com/admin")).toBe("minha-loja.myshopify.com");
    expect(shopDomainOf("loja.com.br")).toBeNull();
  });
  it("verifies the callback hmac over the sorted query", () => {
    const query = { code: "abc", shop: "loja.myshopify.com", state: "s", timestamp: "1" };
    const hmac = createHmac("sha256", "secret")
      .update("code=abc&shop=loja.myshopify.com&state=s&timestamp=1")
      .digest("hex");
    expect(verifyShopifyHmac({ ...query, hmac }, "secret")).toBe(true);
    expect(verifyShopifyHmac({ ...query, hmac }, "other")).toBe(false);
    expect(verifyShopifyHmac(query, "secret")).toBe(false);
  });
});
