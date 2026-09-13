import { createHmac, timingSafeEqual } from "node:crypto";
import type { FinancialStatus, ProcessingMethod } from "@ecommerce/database/enums";
import type { OrderInput } from "@/modules/imports/contract";

type Money = { shopMoney?: { amount?: string | null } | null } | null | undefined;

export type ShopifyOrderNode = {
  id: string;
  name?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  cancelledAt?: string | null;
  displayFinancialStatus?: string | null;
  currentTotalPriceSet?: Money;
  subtotalPriceSet?: Money;
  totalDiscountsSet?: Money;
  totalShippingPriceSet?: Money;
  paymentGatewayNames?: string[] | null;
  discountCodes?: string[] | null;
  customer?: { email?: string | null; displayName?: string | null } | null;
  shippingAddress?: { city?: string | null; provinceCode?: string | null } | null;
  customerJourneySummary?: {
    firstVisit?: {
      utmParameters?: {
        source?: string | null;
        medium?: string | null;
        campaign?: string | null;
      } | null;
    } | null;
  } | null;
  lineItems?: {
    nodes?: {
      sku?: string | null;
      title?: string | null;
      quantity?: number | null;
      originalUnitPriceSet?: Money;
      variant?: {
        id?: string | null;
        product?: { id?: string | null; productType?: string | null } | null;
      } | null;
    }[];
  } | null;
};

export const SHOPIFY_CHANNEL = "Shopify";
const DEFAULT_CATEGORY = "Sem categoria";

const money = (value: Money): number => {
  const parsed = Number(value?.shopMoney?.amount ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const statusOf: Record<string, FinancialStatus> = {
  PAID: "PAID",
  PARTIALLY_PAID: "PAID",
  PENDING: "PENDING",
  AUTHORIZED: "AUTHORIZED",
  VOIDED: "CANCELLED",
  REFUNDED: "REFUNDED",
  PARTIALLY_REFUNDED: "REFUNDED",
};

const gidTail = (gid: string | null | undefined) => gid?.split("/").pop() ?? "0";

export function shopifyMethodOf(gateways: string[] | null | undefined): ProcessingMethod {
  const name = (gateways ?? []).join(" ").toLowerCase();
  if (/pix/.test(name)) return "PIX";
  if (/boleto/.test(name)) return "BOLETO";
  return "CREDIT_CARD";
}

export function shopifyOrderInputOf(node: ShopifyOrderNode): OrderInput | null {
  const email = node.customer?.email?.trim().toLowerCase();
  if (!email || !node.createdAt) return null;
  const items = (node.lineItems?.nodes ?? []).map((line) => ({
    sku: (line.sku?.trim() || `SH-${gidTail(line.variant?.id)}`).slice(0, 80),
    productName: line.title?.trim() || "Produto",
    category: line.variant?.product?.productType?.trim() || DEFAULT_CATEGORY,
    quantity: Math.max(1, line.quantity ?? 1),
    unitPrice: money(line.originalUnitPriceSet),
    unitCost: null,
  }));
  if (items.length === 0) return null;
  const productRevenue = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const utm = node.customerJourneySummary?.firstVisit?.utmParameters;
  return {
    number: node.name?.trim() || `#${gidTail(node.id)}`,
    placedAt: node.createdAt.slice(0, 10),
    status: node.cancelledAt
      ? "CANCELLED"
      : (statusOf[node.displayFinancialStatus?.toUpperCase() ?? ""] ?? "PENDING"),
    email,
    customerName: node.customer?.displayName?.trim() || email,
    city: node.shippingAddress?.city?.trim() ?? "",
    province: node.shippingAddress?.provinceCode?.trim().toUpperCase().slice(0, 2) || "ND",
    salesPlatform: "ECOMMERCE",
    channel: SHOPIFY_CHANNEL,
    gateway: node.paymentGatewayNames?.[0]?.trim() || "Não informado",
    processingMethod: shopifyMethodOf(node.paymentGatewayNames),
    utmSource: utm?.source?.trim() || null,
    utmMedium: utm?.medium?.trim() || null,
    utmCampaign: utm?.campaign?.trim() || null,
    coupons: (node.discountCodes ?? []).map((c) => c.trim().toUpperCase()).filter(Boolean),
    shipping: money(node.totalShippingPriceSet),
    discount: money(node.totalDiscountsSet),
    rows: [],
    items,
    productRevenue,
    totalPrice: money(node.currentTotalPriceSet),
  };
}

export const ORDERS_QUERY = `query Orders($first: Int!, $after: String, $query: String) {
  orders(first: $first, after: $after, query: $query, sortKey: UPDATED_AT) {
    pageInfo { hasNextPage endCursor }
    nodes {
      id name createdAt updatedAt cancelledAt displayFinancialStatus
      currentTotalPriceSet { shopMoney { amount } }
      subtotalPriceSet { shopMoney { amount } }
      totalDiscountsSet { shopMoney { amount } }
      totalShippingPriceSet { shopMoney { amount } }
      paymentGatewayNames discountCodes
      customer { email displayName }
      shippingAddress { city provinceCode }
      customerJourneySummary { firstVisit { utmParameters { source medium campaign } } }
      lineItems(first: 50) {
        nodes { sku title quantity originalUnitPriceSet { shopMoney { amount } } variant { id product { id productType } } }
      }
    }
  }
}`;

export function verifyShopifyHmac(query: Record<string, string>, secret: string): boolean {
  const { hmac, ...rest } = query;
  if (!hmac) return false;
  const message = Object.keys(rest)
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join("&");
  const digest = createHmac("sha256", secret).update(message).digest("hex");
  if (digest.length !== hmac.length) return false;
  return timingSafeEqual(Buffer.from(digest, "utf8"), Buffer.from(hmac, "utf8"));
}

export function shopDomainOf(input: string): string | null {
  const trimmed = input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  if (!trimmed) return null;
  const host = trimmed.includes(".") ? trimmed : `${trimmed}.myshopify.com`;
  return /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(host) ? host : null;
}
