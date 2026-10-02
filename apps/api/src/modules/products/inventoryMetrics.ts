import {
  isMarketplaceStock,
  type InventoryHealth,
  type InventoryRow,
} from "@ecommerce/contracts/products";

export type InventoryFacts = Omit<
  InventoryRow,
  | "velocity"
  | "daysToZero"
  | "stockOutDate"
  | "stockValue"
  | "revenuePotential"
  | "daysOutOfStock"
  | "lostRevenueSinceStockOut"
  | "stockOutCostPerDay"
  | "marketplaceStock"
>;

const DAY = 86_400_000;
const dayIndex = (iso: string) => Math.round(new Date(`${iso}T00:00:00.000Z`).getTime() / DAY);
const isoDay = (index: number) => new Date(index * DAY).toISOString().slice(0, 10);

export function deriveInventory(facts: InventoryFacts, today: string): InventoryRow {
  const velocity = facts.sold30 > 0 ? facts.sold30 / 30 : facts.sold90 / 90;
  const stock = facts.stockQty;
  const daysToZero = stock !== null && stock > 0 && velocity > 0 ? stock / velocity : null;
  const todayIndex = dayIndex(today);
  const unitMargin = facts.cost == null ? null : facts.price - facts.cost;
  const outOfStock = stock !== null && stock <= 0;
  const daysOutOfStock =
    outOfStock && facts.lastSaleAt
      ? Math.max(0, todayIndex - dayIndex(facts.lastSaleAt.slice(0, 10)))
      : null;
  const historicalVelocity =
    facts.sold90 > 0 ? facts.sold90 / 90 : facts.soldTotal > 0 ? velocity : 0;
  return {
    ...facts,
    marketplaceStock: isMarketplaceStock(facts.sold30, facts.sold30Marketplace),
    velocity,
    daysToZero,
    stockOutDate: daysToZero == null ? null : isoDay(todayIndex + Math.ceil(daysToZero)),
    stockValue: facts.cost == null || stock === null ? null : stock * facts.cost,
    revenuePotential: stock === null ? null : stock * facts.price,
    daysOutOfStock,
    lostRevenueSinceStockOut:
      daysOutOfStock == null ? null : daysOutOfStock * historicalVelocity * facts.price,
    stockOutCostPerDay: outOfStock && unitMargin != null ? historicalVelocity * unitMargin : null,
  };
}

export function inventoryHealth(rows: readonly InventoryRow[]): InventoryHealth {
  const tracked = rows.filter((r): r is InventoryRow & { stockQty: number } => r.stockQty !== null);
  const variants = tracked.length;
  const outOfStock = tracked.filter((r) => r.stockQty <= 0).length;
  const stock = tracked.reduce((s, r) => s + Math.max(0, r.stockQty), 0);
  const dailyVelocity = tracked.reduce((s, r) => s + r.velocity, 0);
  return {
    variants,
    untracked: rows.length - variants,
    outOfStock,
    stockOutRate: variants > 0 ? (outOfStock / variants) * 100 : null,
    coverageDays: dailyVelocity > 0 ? stock / dailyVelocity : null,
  };
}
