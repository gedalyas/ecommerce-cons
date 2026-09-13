import { prismaClient, type Prisma } from "@ecommerce/database/client";
import type { AdSpendRow, OrderInput, TrafficRow } from "./importRows.types";

const CHUNK = 200;

const dayOf = (day: string) => new Date(`${day}T00:00:00.000Z`);

function chunks<T>(items: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += CHUNK) out.push(items.slice(i, i + CHUNK));
  return out;
}

type Tx = Prisma.TransactionClient;

async function customerIdFor(tx: Tx, clientId: string, order: OrderInput): Promise<string> {
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
): Promise<{ productId: string; variantId: string }> {
  const existing = await tx.productVariant.findFirst({
    where: { sku: item.sku, product: { clientId } },
    select: { id: true, productId: true },
  });
  if (existing) return { productId: existing.productId, variantId: existing.id };
  const product = await tx.product.create({
    data: {
      clientId,
      name: item.productName,
      category: item.category,
      variants: {
        create: { sku: item.sku, price: item.unitPrice, cost: item.unitCost, stockQty: 0 },
      },
    },
    select: { id: true, variants: { select: { id: true }, take: 1 } },
  });
  return { productId: product.id, variantId: product.variants[0]!.id };
}

async function writeOrder(tx: Tx, clientId: string, order: OrderInput): Promise<void> {
  const customerId = await customerIdFor(tx, clientId, order);
  const previousPaid = await tx.order.count({
    where: { customerId, financialStatus: "PAID", number: { not: order.number } },
  });
  const items = [];
  for (const item of order.items) {
    const ids = await variantFor(tx, clientId, item);
    items.push({
      ...ids,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      unitCost: item.unitCost,
    });
  }
  const placedAt = dayOf(order.placedAt);
  const data = {
    customerId,
    placedAt,
    paidAt: order.status === "PAID" ? placedAt : null,
    salesPlatform: order.salesPlatform,
    channel: order.channel,
    utmSource: order.utmSource,
    utmMedium: order.utmMedium,
    utmCampaign: order.utmCampaign,
    financialStatus: order.status,
    paymentGateway: order.gateway,
    processingMethod: order.processingMethod,
    productRevenue: order.productRevenue,
    shippingRevenue: order.shipping,
    totalDiscounts: order.discount,
    totalPrice: order.totalPrice,
    discountCodes: order.coupons,
    province: order.province,
    city: order.city,
    orderNumberForCustomer: previousPaid + 1,
    itemsCount: order.items.reduce((s, i) => s + i.quantity, 0),
  };
  const saved = await tx.order.upsert({
    where: { clientId_number: { clientId, number: order.number } },
    create: { clientId, number: order.number, ...data },
    update: data,
    select: { id: true },
  });
  await tx.orderItem.deleteMany({ where: { orderId: saved.id } });
  await tx.orderItem.createMany({ data: items.map((i) => ({ ...i, orderId: saved.id })) });
}

export async function persistOrders(clientId: string, orders: OrderInput[]): Promise<number> {
  let written = 0;
  for (const group of chunks(orders)) {
    await prismaClient.$transaction(async (tx) => {
      for (const order of group) await writeOrder(tx, clientId, order);
    });
    written += group.length;
  }
  return written;
}

export async function persistAdSpend(clientId: string, rows: AdSpendRow[]): Promise<number> {
  const days = new Map<string, Set<string>>();
  for (const row of rows) {
    if (!days.has(row.platform)) days.set(row.platform, new Set());
    days.get(row.platform)!.add(row.date);
  }
  await prismaClient.$transaction(async (tx) => {
    for (const [platform, dates] of days) {
      await tx.adSpendDaily.deleteMany({
        where: {
          clientId,
          platform: platform as AdSpendRow["platform"],
          date: { in: [...dates].map(dayOf) },
        },
      });
    }
  });
  for (const group of chunks(rows)) {
    await prismaClient.adSpendDaily.createMany({
      data: group.map(({ row: _row, date, ...rest }) => ({ clientId, date: dayOf(date), ...rest })),
    });
  }
  return rows.length;
}

export async function persistTraffic(clientId: string, rows: TrafficRow[]): Promise<number> {
  for (const group of chunks(rows)) {
    await prismaClient.$transaction(
      group.map(({ row: _row, date, source, medium, ...counts }) =>
        prismaClient.trafficDaily.upsert({
          where: { clientId_date_source_medium: { clientId, date: dayOf(date), source, medium } },
          create: { clientId, date: dayOf(date), source, medium, ...counts },
          update: counts,
        }),
      ),
    );
  }
  return rows.length;
}
