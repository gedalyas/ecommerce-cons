import {
  adPlatformOptions,
  orderStatusOptions,
  processingMethodOptions,
  salesPlatformOptions,
  type ImportRowError,
} from "@ecommerce/contracts/imports";
import type {
  AdPlatform,
  FinancialStatus,
  ProcessingMethod,
  SalesPlatform,
} from "@ecommerce/database/enums";
import type { AdSpendRow, OrderInput, OrderLine, TrafficRow } from "./importRows.types";
import { collectRows, type RowReader } from "./rowReader";

const financialStatusOf: Record<(typeof orderStatusOptions)[number], FinancialStatus> = {
  pago: "PAID",
  pendente: "PENDING",
  autorizado: "AUTHORIZED",
  cancelado: "CANCELLED",
  estornado: "REFUNDED",
};

const salesPlatformOf: Record<(typeof salesPlatformOptions)[number], SalesPlatform> = {
  ecommerce: "ECOMMERCE",
  marketplace: "MARKETPLACE",
};

const processingMethodOf: Record<(typeof processingMethodOptions)[number], ProcessingMethod> = {
  cartao: "CREDIT_CARD",
  pix: "PIX",
  boleto: "BOLETO",
};

const adPlatformOf: Record<(typeof adPlatformOptions)[number], AdPlatform> = {
  meta: "META",
  google: "GOOGLE",
  tiktok: "TIKTOK",
};

const UNKNOWN_PROVINCE = "ND";
const DEFAULT_CHANNEL = "Loja";
const DEFAULT_GATEWAY = "Não informado";
const DEFAULT_CATEGORY = "Sem categoria";

const couponsOf = (raw: string | null): string[] =>
  (raw ?? "")
    .split(/[,;|]/)
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);

export function orderLineOf(r: RowReader): OrderLine {
  return {
    row: r.row,
    number: r.text("number"),
    placedAt: r.date("placedAt"),
    status: financialStatusOf[r.option("status", orderStatusOptions)],
    email: r.text("email").toLowerCase(),
    customerName: r.text("customerName"),
    city: r.optionalText("city") ?? "",
    province: (r.optionalText("province") ?? UNKNOWN_PROVINCE).toUpperCase(),
    salesPlatform: salesPlatformOf[r.option("salesPlatform", salesPlatformOptions, "ecommerce")],
    channel: r.optionalText("channel") ?? DEFAULT_CHANNEL,
    gateway: r.optionalText("gateway") ?? DEFAULT_GATEWAY,
    processingMethod:
      processingMethodOf[r.option("processingMethod", processingMethodOptions, "cartao")],
    utmSource: r.optionalText("utmSource"),
    utmMedium: r.optionalText("utmMedium"),
    utmCampaign: r.optionalText("utmCampaign"),
    coupons: couponsOf(r.optionalText("coupons")),
    shipping: r.number("shipping", 0),
    discount: r.number("discount", 0),
    sku: r.text("sku"),
    productName: r.text("productName"),
    category: r.optionalText("category") ?? DEFAULT_CATEGORY,
    quantity: r.integer("quantity"),
    unitPrice: r.number("unitPrice"),
    unitCost: r.optionalNumber("unitCost"),
  };
}

export function groupOrders(lines: OrderLine[]): OrderInput[] {
  const byNumber = new Map<string, OrderInput>();
  for (const line of lines) {
    const { row, sku, productName, category, quantity, unitPrice, unitCost, ...head } = line;
    const item = { sku, productName, category, quantity, unitPrice, unitCost };
    const existing = byNumber.get(line.number);
    if (existing) {
      existing.items.push(item);
      existing.rows.push(row);
    } else {
      byNumber.set(line.number, {
        ...head,
        rows: [row],
        items: [item],
        productRevenue: 0,
        totalPrice: 0,
      });
    }
  }
  return [...byNumber.values()].map((order) => {
    const productRevenue = order.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    return {
      ...order,
      productRevenue,
      totalPrice: Math.max(0, productRevenue + order.shipping - order.discount),
    };
  });
}

export function mapOrders(
  header: string[],
  rows: string[][],
): { orders: OrderInput[]; errors: ImportRowError[] } {
  const { parsed, errors } = collectRows("ORDERS", header, rows, orderLineOf);
  return { orders: groupOrders(parsed), errors };
}

export function adSpendRowOf(r: RowReader): AdSpendRow {
  const campaignName = r.text("campaignName");
  const adsetName = r.optionalText("adsetName") ?? campaignName;
  const adName = r.optionalText("adName") ?? adsetName;
  return {
    row: r.row,
    date: r.date("date"),
    platform: adPlatformOf[r.option("platform", adPlatformOptions)],
    campaignId: r.optionalText("campaignId") ?? campaignName,
    campaignName,
    adsetId: r.optionalText("adsetId") ?? adsetName,
    adsetName,
    adId: r.optionalText("adId") ?? adName,
    adName,
    spend: r.number("spend"),
    platformFee: r.number("platformFee", 0),
    impressions: r.integer("impressions", 0),
    clicks: r.integer("clicks", 0),
    conversions: r.integer("conversions", 0),
    attributedRevenue: r.number("attributedRevenue", 0),
  };
}

export function mapAdSpend(
  header: string[],
  rows: string[][],
): { rows: AdSpendRow[]; errors: ImportRowError[] } {
  const { parsed, errors } = collectRows("AD_SPEND", header, rows, adSpendRowOf);
  return { rows: parsed, errors };
}

export function trafficRowOf(r: RowReader): TrafficRow {
  const sessions = r.integer("sessions");
  return {
    row: r.row,
    date: r.date("date"),
    source: r.text("source").toLowerCase(),
    medium: r.text("medium").toLowerCase(),
    sessions,
    users: r.integer("users", sessions),
    newUsers: r.integer("newUsers", 0),
    viewItem: r.integer("viewItem", 0),
    addToCart: r.integer("addToCart", 0),
    beginCheckout: r.integer("beginCheckout", 0),
  };
}

export function mapTraffic(
  header: string[],
  rows: string[][],
): { rows: TrafficRow[]; errors: ImportRowError[] } {
  const { parsed, errors } = collectRows("TRAFFIC", header, rows, trafficRowOf);
  return { rows: parsed, errors };
}
