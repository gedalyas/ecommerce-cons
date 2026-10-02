import type { ConnectorKey } from "@ecommerce/contracts/connectors";
import { prismaClient, type Prisma } from "@ecommerce/database/client";
import type { AdSpendRow, OrderInput, TrafficRow } from "./importRows.types";
import type {
  AdSpendDayKey,
  AdSpendSnapshot,
  OrderSnapshot,
  TrafficSnapshot,
} from "./importUndo.types";
import { safeImageUrl } from "./adSpendRules";
import { orderRowOf } from "./orderRow";
import { adSpendDayKey, adSpendScopes, scopeAccounts, trafficKey } from "./undoPlan";
import type { UndoRecorder } from "./undoRecorder";

const CHUNK = 200;

const dayOf = (day: string) => new Date(`${day}T00:00:00.000Z`);
const num = (value: Prisma.Decimal | number) => Number(value);

function chunks<T>(items: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += CHUNK) out.push(items.slice(i, i + CHUNK));
  return out;
}

type Tx = Prisma.TransactionClient;

export type OrderOrigin = { source: ConnectorKey; connectionId: string | null };

const orderSnapshotSelect = {
  source: true,
  connectionId: true,
  customerId: true,
  placedAt: true,
  paidAt: true,
  salesPlatform: true,
  channel: true,
  utmSource: true,
  utmMedium: true,
  utmCampaign: true,
  financialStatus: true,
  paymentGateway: true,
  processingMethod: true,
  fulfillment: true,
  productRevenue: true,
  shippingRevenue: true,
  totalDiscounts: true,
  totalPrice: true,
  discountCodes: true,
  country: true,
  province: true,
  city: true,
  orderNumberForCustomer: true,
  itemsCount: true,
  items: {
    select: {
      productId: true,
      variantId: true,
      sku: true,
      quantity: true,
      unitPrice: true,
      unitCost: true,
    },
  },
} as const;

type OrderRow = Prisma.OrderGetPayload<{ select: typeof orderSnapshotSelect }>;

export function orderSnapshotOf(row: OrderRow): OrderSnapshot {
  return {
    ...row,
    placedAt: row.placedAt.toISOString(),
    paidAt: row.paidAt?.toISOString() ?? null,
    productRevenue: num(row.productRevenue),
    shippingRevenue: num(row.shippingRevenue),
    totalDiscounts: num(row.totalDiscounts),
    totalPrice: num(row.totalPrice),
    items: row.items.map((i) => ({
      ...i,
      unitPrice: num(i.unitPrice),
      unitCost: i.unitCost === null ? null : num(i.unitCost),
    })),
  };
}

async function customerIdFor(
  tx: Tx,
  clientId: string,
  order: OrderInput,
  undo: UndoRecorder,
): Promise<string> {
  if (!undo.has("CUSTOMER", order.email)) {
    const existing = await tx.customer.findUnique({
      where: { clientId_email: { clientId, email: order.email } },
      select: { name: true },
    });
    undo.add({ entity: "CUSTOMER", key: order.email, previous: existing });
  }
  const customer = await tx.customer.upsert({
    where: { clientId_email: { clientId, email: order.email } },
    create: {
      clientId,
      email: order.email,
      name: order.customerName,
      city: order.city || null,
      province: order.province === "ND" ? null : order.province,
      acquisitionSource: order.utmSource,
    },
    update: { name: order.customerName },
    select: { id: true },
  });
  return customer.id;
}

async function variantFor(
  tx: Tx,
  clientId: string,
  item: OrderInput["items"][number],
  undo: UndoRecorder,
): Promise<{ productId: string; variantId: string; cost: number | null }> {
  const existing = await tx.productVariant.findFirst({
    where: { sku: item.sku, product: { clientId } },
    orderBy: { id: "asc" },
    select: { id: true, productId: true, cost: true },
  });
  if (existing) {
    const cost = existing.cost === null ? null : num(existing.cost);
    return { productId: existing.productId, variantId: existing.id, cost };
  }
  const product = await tx.product.create({
    data: {
      clientId,
      name: item.productName,
      category: item.category,
      variants: {
        create: { sku: item.sku, price: item.unitPrice, cost: item.unitCost },
      },
    },
    select: { id: true, variants: { select: { id: true }, take: 1 } },
  });
  undo.add({ entity: "PRODUCT", key: product.id, previous: null });
  return { productId: product.id, variantId: product.variants[0]!.id, cost: item.unitCost };
}

async function writeOrder(
  tx: Tx,
  clientId: string,
  order: OrderInput,
  undo: UndoRecorder,
  origin: OrderOrigin,
): Promise<void> {
  const before = await tx.order.findUnique({
    where: { clientId_number: { clientId, number: order.number } },
    select: orderSnapshotSelect,
  });
  undo.add({ entity: "ORDER", key: order.number, previous: before && orderSnapshotOf(before) });
  const customerId = await customerIdFor(tx, clientId, order, undo);
  const previousPaid = await tx.order.count({
    where: { customerId, financialStatus: "PAID", number: { not: order.number } },
  });
  const items = [];
  for (const item of order.items) {
    const { cost, ...ids } = await variantFor(tx, clientId, item, undo);
    items.push({
      ...ids,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      unitCost: item.unitCost ?? cost,
    });
  }
  const data = {
    ...orderRowOf(order, customerId, previousPaid + 1),
    source: origin.source,
    connectionId: origin.connectionId,
  };
  const { fulfillment: _unknown, ...withoutFulfillment } = data;
  const saved = await tx.order.upsert({
    where: { clientId_number: { clientId, number: order.number } },
    create: { clientId, number: order.number, ...data },
    update: data.fulfillment == null ? withoutFulfillment : data,
    select: { id: true },
  });
  await tx.orderItem.deleteMany({ where: { orderId: saved.id } });
  await tx.orderItem.createMany({ data: items.map((i) => ({ ...i, orderId: saved.id })) });
}

export async function persistOrders(
  clientId: string,
  orders: OrderInput[],
  undo: UndoRecorder,
  origin: OrderOrigin,
): Promise<number> {
  let written = 0;
  for (const group of chunks(orders)) {
    await prismaClient.$transaction(async (tx) => {
      for (const order of group) await writeOrder(tx, clientId, order, undo, origin);
    });
    written += group.length;
  }
  return written;
}

const adSpendSnapshotSelect = {
  campaignId: true,
  campaignName: true,
  adsetId: true,
  adsetName: true,
  adId: true,
  adName: true,
  spend: true,
  platformFee: true,
  impressions: true,
  clicks: true,
  conversions: true,
  attributedRevenue: true,
  accountId: true,
  accountName: true,
  campaignType: true,
  reach: true,
  linkClicks: true,
  landingPageViews: true,
  addToCart: true,
  leads: true,
  messages: true,
  eligibleImpressions: true,
  thumbnailUrl: true,
} as const;

type AdSpendSnapshotRow = Prisma.AdSpendDailyGetPayload<{ select: typeof adSpendSnapshotSelect }>;

export const adSpendSnapshotOf = (row: AdSpendSnapshotRow): AdSpendSnapshot => ({
  ...row,
  spend: num(row.spend),
  platformFee: num(row.platformFee),
  attributedRevenue: num(row.attributedRevenue),
});

export function adSpendScopeWhere(clientId: string, scope: AdSpendDayKey) {
  const accounts = scopeAccounts(scope);
  return {
    clientId,
    platform: scope.platform,
    date: dayOf(scope.date),
    ...(accounts ? { accountId: { in: accounts } } : {}),
  };
}

export async function persistAdSpend(
  clientId: string,
  rows: AdSpendRow[],
  undo: UndoRecorder,
): Promise<number> {
  await prismaClient.$transaction(async (tx) => {
    for (const scope of adSpendScopes(rows)) {
      const where = adSpendScopeWhere(clientId, scope);
      const previous = await tx.adSpendDaily.findMany({ where, select: adSpendSnapshotSelect });
      undo.add({
        entity: "AD_SPEND_DAY",
        key: adSpendDayKey(scope),
        previous: previous.length > 0 ? previous.map(adSpendSnapshotOf) : null,
      });
      await tx.adSpendDaily.deleteMany({ where });
    }
  });
  for (const group of chunks(rows)) {
    await prismaClient.adSpendDaily.createMany({
      data: group.map(({ row: _row, date, thumbnailUrl, ...rest }) => ({
        clientId,
        date: dayOf(date),
        ...rest,
        thumbnailUrl: safeImageUrl(thumbnailUrl),
      })),
    });
  }
  return rows.length;
}

const trafficSnapshotSelect = {
  sessions: true,
  users: true,
  newUsers: true,
  viewItem: true,
  addToCart: true,
  beginCheckout: true,
  engagedSessions: true,
  pageViews: true,
  durationSeconds: true,
  purchases: true,
} as const;

export async function persistTraffic(
  clientId: string,
  rows: TrafficRow[],
  undo: UndoRecorder,
): Promise<number> {
  for (const group of chunks(rows)) {
    await prismaClient.$transaction(async (tx) => {
      for (const { row: _row, date, source, medium, ...counts } of group) {
        const where = {
          clientId_date_source_medium: { clientId, date: dayOf(date), source, medium },
        };
        const previous: TrafficSnapshot | null = await tx.trafficDaily.findUnique({
          where,
          select: trafficSnapshotSelect,
        });
        undo.add({ entity: "TRAFFIC", key: trafficKey({ date, source, medium }), previous });
        await tx.trafficDaily.upsert({
          where,
          create: { clientId, date: dayOf(date), source, medium, ...counts },
          update: counts,
        });
      }
    });
  }
  return rows.length;
}
