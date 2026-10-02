import { mercadoLivreBuyerDomain } from "@ecommerce/contracts/customers";
import type { FinancialStatus, ProcessingMethod } from "@ecommerce/database/enums";
import type { OrderInput } from "@/modules/imports/contract";

export type MercadoLivreOrder = {
  id: number | string;
  status?: string | null;
  date_created?: string | null;
  last_updated?: string | null;
  total_amount?: number | null;
  paid_amount?: number | null;
  coupon?: { amount?: number | null; id?: string | null } | null;
  buyer?: {
    id?: number | string | null;
    nickname?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
  } | null;
  payments?:
    | {
        status?: string | null;
        payment_type?: string | null;
        shipping_cost?: number | null;
        coupon_amount?: number | null;
      }[]
    | null;
  order_items?:
    | {
        item?: {
          id?: string | null;
          title?: string | null;
          seller_sku?: string | null;
          variation_id?: number | string | null;
        } | null;
        quantity?: number | null;
        unit_price?: number | null;
      }[]
    | null;
  shipping?: { id?: number | string | null } | null;
  shipment?: MercadoLivreShipment | null;
};

export type MercadoLivreShipment = {
  receiver_address?: {
    city?: { name?: string | null } | null;
    state?: { id?: string | null; name?: string | null } | null;
  } | null;
  shipping_option?: { cost?: number | null; list_cost?: number | null } | null;
  logistic_type?: string | null;
};

export const MERCADO_LIVRE_CHANNEL = "Mercado Livre";
const GATEWAY = "Mercado Pago";
const DEFAULT_CATEGORY = "Sem categoria";

const statusOf: Record<string, FinancialStatus> = {
  paid: "PAID",
  confirmed: "PENDING",
  payment_required: "PENDING",
  payment_in_process: "PENDING",
  partially_paid: "PENDING",
  cancelled: "CANCELLED",
  invalid: "CANCELLED",
};

const number = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

export function mercadoLivreStatusOf(order: MercadoLivreOrder): FinancialStatus {
  if ((order.payments ?? []).some((p) => p.status === "refunded")) return "REFUNDED";
  return statusOf[order.status ?? ""] ?? "PENDING";
}

export function mercadoLivreMethodOf(order: MercadoLivreOrder): ProcessingMethod {
  const type = order.payments?.[0]?.payment_type ?? "";
  if (type === "ticket" || type === "atm") return "BOLETO";
  if (type === "bank_transfer" || type === "account_money") return "PIX";
  return "CREDIT_CARD";
}

export function mercadoLivreBuyerEmailOf(buyer: MercadoLivreOrder["buyer"]): string | null {
  const email = buyer?.email?.trim().toLowerCase();
  if (email) return email;
  const id = buyer?.id;
  return id === null || id === undefined ? null : `${id}@${mercadoLivreBuyerDomain}`;
}

export function mercadoLivreProvinceOf(shipment: MercadoLivreShipment | null | undefined) {
  const id = shipment?.receiver_address?.state?.id?.trim().toUpperCase() ?? "";
  const match = id.match(/^BR-([A-Z]{2})$/);
  return match?.[1] ?? "ND";
}

export const mercadoLivreFulfillmentOf = (
  shipment: MercadoLivreShipment | null | undefined,
): "SELLER" | "MARKETPLACE" | null =>
  !shipment?.logistic_type
    ? null
    : shipment.logistic_type === "fulfillment"
      ? "MARKETPLACE"
      : "SELLER";

export function mercadoLivreOrderInputOf(order: MercadoLivreOrder): OrderInput | null {
  const email = mercadoLivreBuyerEmailOf(order.buyer);
  if (!email || !order.date_created) return null;
  const items = (order.order_items ?? []).map((line) => ({
    sku: (line.item?.seller_sku?.trim() || line.item?.id?.trim() || "ML").slice(0, 80),
    productName: line.item?.title?.trim() || "Produto",
    category: DEFAULT_CATEGORY,
    quantity: Math.max(1, line.quantity ?? 1),
    unitPrice: number(line.unit_price),
    unitCost: null,
  }));
  if (items.length === 0) return null;
  const productRevenue = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const shipping = (order.payments ?? []).reduce((s, p) => s + number(p.shipping_cost), 0);
  const discount = number(order.coupon?.amount);
  const buyerName = [order.buyer?.first_name, order.buyer?.last_name]
    .map((part) => part?.trim() ?? "")
    .filter(Boolean)
    .join(" ");
  return {
    number: `ML-${order.id}`,
    placedAt: order.date_created.slice(0, 10),
    status: mercadoLivreStatusOf(order),
    email,
    customerName: buyerName || order.buyer?.nickname?.trim() || email,
    city: order.shipment?.receiver_address?.city?.name?.trim() ?? "",
    province: mercadoLivreProvinceOf(order.shipment),
    salesPlatform: "MARKETPLACE",
    channel: MERCADO_LIVRE_CHANNEL,
    gateway: GATEWAY,
    processingMethod: mercadoLivreMethodOf(order),
    fulfillment: mercadoLivreFulfillmentOf(order.shipment),
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    coupons: order.coupon?.id ? [order.coupon.id.trim().toUpperCase()] : [],
    shipping,
    discount,
    rows: [],
    items,
    productRevenue,
    totalPrice: number(order.total_amount) + shipping - discount,
  };
}
