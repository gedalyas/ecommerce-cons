import type { FinancialStatus, ProcessingMethod } from "@ecommerce/database/enums";
import type { OrderInput } from "@/modules/imports/contract";

type Money = { CurrencyCode?: string | null; Amount?: string | null } | null | undefined;

export type AmazonOrder = {
  AmazonOrderId: string;
  PurchaseDate?: string | null;
  LastUpdateDate?: string | null;
  OrderStatus?: string | null;
  OrderTotal?: Money;
  PaymentMethod?: string | null;
  PaymentMethodDetails?: string[] | null;
  ShippingAddress?: {
    City?: string | null;
    StateOrRegion?: string | null;
    CountryCode?: string | null;
  } | null;
  BuyerInfo?: { BuyerEmail?: string | null; BuyerName?: string | null } | null;
  items?: AmazonOrderItem[] | null;
};

export type AmazonOrderItem = {
  ASIN?: string | null;
  SellerSKU?: string | null;
  Title?: string | null;
  QuantityOrdered?: number | null;
  ItemPrice?: Money;
  ShippingPrice?: Money;
  PromotionDiscount?: Money;
};

export const AMAZON_CHANNEL = "Amazon";
const GATEWAY = "Amazon Pay";
const DEFAULT_CATEGORY = "Sem categoria";
const BUYER_EMAIL_DOMAIN = "comprador.amazon.com.br";

const statusOf: Record<string, FinancialStatus> = {
  Shipped: "PAID",
  Unshipped: "PAID",
  PartiallyShipped: "PAID",
  InvoiceUnconfirmed: "PAID",
  Pending: "PENDING",
  PendingAvailability: "PENDING",
  Canceled: "CANCELLED",
  Unfulfillable: "CANCELLED",
};

const stateOf: Record<string, string> = {
  acre: "AC",
  alagoas: "AL",
  amapa: "AP",
  amazonas: "AM",
  bahia: "BA",
  ceara: "CE",
  "distrito federal": "DF",
  "espirito santo": "ES",
  goias: "GO",
  maranhao: "MA",
  "mato grosso": "MT",
  "mato grosso do sul": "MS",
  "minas gerais": "MG",
  para: "PA",
  paraiba: "PB",
  parana: "PR",
  pernambuco: "PE",
  piaui: "PI",
  "rio de janeiro": "RJ",
  "rio grande do norte": "RN",
  "rio grande do sul": "RS",
  rondonia: "RO",
  roraima: "RR",
  "santa catarina": "SC",
  "sao paulo": "SP",
  sergipe: "SE",
  tocantins: "TO",
};

const money = (value: Money): number => {
  const parsed = Number(value?.Amount ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const plain = (value: string) => value.normalize("NFD").replace(/\p{M}/gu, "").trim().toLowerCase();

export function amazonProvinceOf(stateOrRegion: string | null | undefined): string {
  const value = stateOrRegion?.trim() ?? "";
  if (/^[A-Za-z]{2}$/.test(value)) return value.toUpperCase();
  return stateOf[plain(value)] ?? "ND";
}

export function amazonMethodOf(details: string[] | null | undefined): ProcessingMethod {
  const joined = (details ?? []).join(" ").toLowerCase();
  if (/pix/.test(joined)) return "PIX";
  if (/boleto|bankticket/.test(joined)) return "BOLETO";
  return "CREDIT_CARD";
}

export function amazonBuyerEmailOf(order: AmazonOrder): string {
  const email = order.BuyerInfo?.BuyerEmail?.trim().toLowerCase();
  return email || `${order.AmazonOrderId.toLowerCase()}@${BUYER_EMAIL_DOMAIN}`;
}

export function amazonOrderInputOf(order: AmazonOrder): OrderInput | null {
  if (!order.PurchaseDate) return null;
  const items = (order.items ?? []).map((line) => {
    const quantity = Math.max(1, line.QuantityOrdered ?? 1);
    return {
      sku: (line.SellerSKU?.trim() || line.ASIN?.trim() || "AMZ").slice(0, 80),
      productName: line.Title?.trim() || "Produto",
      category: DEFAULT_CATEGORY,
      quantity,
      unitPrice: money(line.ItemPrice) / quantity,
      unitCost: null,
    };
  });
  if (items.length === 0) return null;
  const productRevenue = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const shipping = (order.items ?? []).reduce((s, i) => s + money(i.ShippingPrice), 0);
  const discount = (order.items ?? []).reduce((s, i) => s + money(i.PromotionDiscount), 0);
  const email = amazonBuyerEmailOf(order);
  return {
    number: order.AmazonOrderId,
    placedAt: order.PurchaseDate.slice(0, 10),
    status: statusOf[order.OrderStatus ?? ""] ?? "PENDING",
    email,
    customerName: order.BuyerInfo?.BuyerName?.trim() || "Comprador Amazon",
    city: order.ShippingAddress?.City?.trim() ?? "",
    province: amazonProvinceOf(order.ShippingAddress?.StateOrRegion),
    salesPlatform: "MARKETPLACE",
    channel: AMAZON_CHANNEL,
    gateway: GATEWAY,
    processingMethod: amazonMethodOf(order.PaymentMethodDetails),
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    coupons: [],
    shipping,
    discount,
    rows: [],
    items,
    productRevenue,
    totalPrice: money(order.OrderTotal),
  };
}
