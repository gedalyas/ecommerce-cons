import type { FinancialStatus, ProcessingMethod } from "@ecommerce/database/enums";
import type { OrderInput } from "@/modules/imports/contract";

export type NuvemshopOrder = {
  id: number | string;
  number?: number | string | null;
  created_at?: string | null;
  updated_at?: string | null;
  paid_at?: string | null;
  payment_status?: string | null;
  status?: string | null;
  total?: string | number | null;
  subtotal?: string | number | null;
  discount?: string | number | null;
  promotional_discount?: { total_discount_amount?: string | number | null } | null;
  shipping_cost_customer?: string | number | null;
  gateway?: string | null;
  payment_details?: { method?: string | null } | null;
  customer?: { name?: string | null; email?: string | null } | null;
  shipping_address?: { city?: string | null; province?: string | null } | null;
  products?: {
    product_id?: number | string | null;
    variant_id?: number | string | null;
    sku?: string | null;
    name?: string | null;
    quantity?: number | string | null;
    price?: string | number | null;
  }[];
  coupon?: { code?: string | null }[] | null;
  landing_url?: string | null;
};

export const NUVEMSHOP_CHANNEL = "Nuvemshop";
const DEFAULT_CATEGORY = "Sem categoria";
export const UNKNOWN_PROVINCE = "ND";

const paymentStatusOf: Record<string, FinancialStatus> = {
  paid: "PAID",
  pending: "PENDING",
  authorized: "AUTHORIZED",
  voided: "CANCELLED",
  abandoned: "CANCELLED",
  refunded: "REFUNDED",
  partially_refunded: "REFUNDED",
};

const methodOf: Record<string, ProcessingMethod> = {
  credit_card: "CREDIT_CARD",
  debit_card: "CREDIT_CARD",
  pix: "PIX",
  boleto: "BOLETO",
  ticket: "BOLETO",
};

const provinceOf: Record<string, string> = {
  acre: "AC",
  alagoas: "AL",
  amapa: "AP",
  amazonas: "AM",
  bahia: "BA",
  ceara: "CE",
  "distrito federal": "DF",
  "federal district": "DF",
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

const num = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
};

const stripAccents = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "");

export function provinceCodeOf(raw: string | null | undefined): string {
  if (!raw) return UNKNOWN_PROVINCE;
  const trimmed = raw.trim();
  if (/^[A-Za-z]{2}$/.test(trimmed)) return trimmed.toUpperCase();
  const name = stripAccents(trimmed)
    .toLowerCase()
    .replace(/^state of /, "");
  return provinceOf[name] ?? UNKNOWN_PROVINCE;
}

export function utmOf(landingUrl: string | null | undefined): {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
} {
  const empty = { utmSource: null, utmMedium: null, utmCampaign: null };
  if (!landingUrl) return empty;
  try {
    const params = new URL(landingUrl, "https://loja.invalid").searchParams;
    const read = (key: string) => params.get(key)?.trim() || null;
    return {
      utmSource: read("utm_source"),
      utmMedium: read("utm_medium"),
      utmCampaign: read("utm_campaign"),
    };
  } catch {
    return empty;
  }
}

export function financialStatusOf(order: Pick<NuvemshopOrder, "payment_status" | "status">) {
  if (order.status?.toLowerCase() === "cancelled") return "CANCELLED" as const;
  return paymentStatusOf[order.payment_status?.toLowerCase() ?? ""] ?? ("PENDING" as const);
}

export function orderInputOf(order: NuvemshopOrder): OrderInput | null {
  const email = order.customer?.email?.trim().toLowerCase();
  if (!email || !order.created_at) return null;
  const items = (order.products ?? []).map((p) => ({
    sku: (
      p.sku?.trim() ||
      (p.variant_id !== null && p.variant_id !== undefined
        ? `NS-${p.variant_id}`
        : `NS-${p.product_id ?? "0"}`)
    ).slice(0, 80),
    productName: p.name?.trim() || "Produto",
    category: DEFAULT_CATEGORY,
    quantity: Math.max(1, Math.round(num(p.quantity) || 1)),
    unitPrice: num(p.price),
    unitCost: null,
  }));
  if (items.length === 0) return null;
  const productRevenue = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const discount = num(order.discount) + num(order.promotional_discount?.total_discount_amount);
  return {
    number: `#${order.number ?? order.id}`,
    placedAt: order.created_at.slice(0, 10),
    status: financialStatusOf(order),
    email,
    customerName: order.customer?.name?.trim() || email,
    city: order.shipping_address?.city?.trim() ?? "",
    province: provinceCodeOf(order.shipping_address?.province),
    salesPlatform: "ECOMMERCE",
    channel: NUVEMSHOP_CHANNEL,
    gateway: order.gateway?.trim() || "Não informado",
    processingMethod: methodOf[order.payment_details?.method?.toLowerCase() ?? ""] ?? "CREDIT_CARD",
    ...utmOf(order.landing_url),
    coupons: (order.coupon ?? []).map((c) => c.code?.trim().toUpperCase() ?? "").filter(Boolean),
    shipping: num(order.shipping_cost_customer),
    discount,
    rows: [],
    items,
    productRevenue,
    totalPrice:
      order.total !== null && order.total !== undefined
        ? num(order.total)
        : Math.max(0, productRevenue + num(order.shipping_cost_customer) - discount),
  };
}

export function latestUpdatedAt(
  orders: Pick<NuvemshopOrder, "updated_at">[],
  fallback: string,
): string {
  return orders.reduce(
    (latest, o) => (o.updated_at && o.updated_at > latest ? o.updated_at : latest),
    fallback,
  );
}
