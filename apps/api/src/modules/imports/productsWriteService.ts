import { Prisma, prismaClient } from "@ecommerce/database/client";
import type { ProductSheetRow } from "./importRows.types";
import type { VariantSnapshot } from "./importUndo.types";
import type { UndoRecorder } from "./undoRecorder";

const CHUNK = 200;
const TRANSACTION_TIMEOUT_MS = 30_000;
const DEFAULT_CATEGORY = "Sem categoria";

type Tx = Prisma.TransactionClient;

const variantSelect = {
  id: true,
  sku: true,
  productId: true,
  price: true,
  cost: true,
  stockQty: true,
  stockUpdatedAt: true,
  product: { select: { name: true, category: true } },
} as const;

type VariantRow = Prisma.ProductVariantGetPayload<{ select: typeof variantSelect }>;
type CostFill = { variantId: string; cost: number };

const variantSnapshotOf = (v: VariantRow): VariantSnapshot => ({
  price: Number(v.price),
  cost: v.cost === null ? null : Number(v.cost),
  stockQty: v.stockQty,
  stockUpdatedAt: v.stockUpdatedAt?.toISOString() ?? null,
});

const stockOf = (row: ProductSheetRow, now: Date) =>
  row.stock === null ? {} : { stockQty: row.stock, stockUpdatedAt: now };

async function createProduct(
  tx: Tx,
  clientId: string,
  row: ProductSheetRow,
  undo: UndoRecorder,
  now: Date,
) {
  const product = await tx.product.create({
    data: {
      clientId,
      name: row.name ?? row.sku,
      category: row.category ?? DEFAULT_CATEGORY,
      variants: {
        create: { sku: row.sku, price: row.price ?? 0, cost: row.cost, ...stockOf(row, now) },
      },
    },
    select: { id: true },
  });
  undo.add({ entity: "PRODUCT", key: product.id, previous: null });
}

async function updateVariant(
  tx: Tx,
  variant: VariantRow,
  row: ProductSheetRow,
  { undo, now }: { undo: UndoRecorder; now: Date },
) {
  undo.add({ entity: "VARIANT", key: variant.id, previous: variantSnapshotOf(variant) });
  await tx.productVariant.update({
    where: { id: variant.id },
    data: {
      ...(row.cost === null ? {} : { cost: row.cost }),
      ...(row.price === null ? {} : { price: row.price }),
      ...stockOf(row, now),
    },
  });
  if (row.name === null && row.category === null) return;
  undo.add({ entity: "PRODUCT_INFO", key: variant.productId, previous: variant.product });
  await tx.product.update({
    where: { id: variant.productId },
    data: {
      ...(row.name === null ? {} : { name: row.name }),
      ...(row.category === null ? {} : { category: row.category }),
    },
  });
}

async function fillMissingItemCosts(
  tx: Tx,
  clientId: string,
  fills: CostFill[],
  undo: UndoRecorder,
) {
  if (fills.length === 0) return;
  const values = Prisma.join(fills.map((f) => Prisma.sql`(${f.variantId}, ${f.cost}::numeric)`));
  const filled = await tx.$queryRaw<{ id: string; variant_id: string }[]>`
    update order_item i set unit_cost = v.cost
    from (values ${values}) as v(variant_id, cost), sales_order o
    where i.variant_id = v.variant_id and i.order_id = o.id
      and o.client_id = ${clientId} and i.unit_cost is null
    returning i.id, i.variant_id
  `;
  const byVariant = new Map<string, string[]>();
  for (const { id, variant_id } of filled) {
    const ids = byVariant.get(variant_id) ?? [];
    ids.push(id);
    byVariant.set(variant_id, ids);
  }
  for (const [variantId, ids] of byVariant) {
    undo.add({ entity: "ITEM_COST", key: variantId, previous: ids });
  }
}

async function writeGroup(
  tx: Tx,
  clientId: string,
  rows: ProductSheetRow[],
  context: { undo: UndoRecorder; now: Date },
) {
  const variants = await tx.productVariant.findMany({
    where: { sku: { in: rows.map((r) => r.sku) }, product: { clientId } },
    orderBy: { id: "asc" },
    select: variantSelect,
  });
  const bySku = new Map<string, VariantRow>();
  for (const v of variants) if (!bySku.has(v.sku)) bySku.set(v.sku, v);
  const fills: CostFill[] = [];
  for (const row of rows) {
    const variant = bySku.get(row.sku);
    if (!variant) {
      await createProduct(tx, clientId, row, context.undo, context.now);
      continue;
    }
    await updateVariant(tx, variant, row, context);
    if (row.cost !== null) fills.push({ variantId: variant.id, cost: row.cost });
  }
  await fillMissingItemCosts(tx, clientId, fills, context.undo);
}

export async function persistProducts(
  clientId: string,
  rows: ProductSheetRow[],
  undo: UndoRecorder,
  now: Date,
): Promise<number> {
  for (let i = 0; i < rows.length; i += CHUNK) {
    const group = rows.slice(i, i + CHUNK);
    await prismaClient.$transaction((tx) => writeGroup(tx, clientId, group, { undo, now }), {
      timeout: TRANSACTION_TIMEOUT_MS,
    });
  }
  return rows.length;
}
