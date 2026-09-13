import type { InventoryHealth, InventoryRow } from "@ecommerce/contracts/products";

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
>;

const DAY = 86_400_000;
const dayIndex = (iso: string) => Math.round(new Date(`${iso}T00:00:00.000Z`).getTime() / DAY);
const isoDay = (index: number) => new Date(index * DAY).toISOString().slice(0, 10);

/**
 * Velocity is units per day over the last 30 days; when nothing sold in 30
 * days, the 90-day pace. Projections use the price and cost of the variant.
 */
export function deriveInventory(facts: InventoryFacts, today: string): InventoryRow {
  const velocity = facts.sold30 > 0 ? facts.sold30 / 30 : facts.sold90 / 90;
  const daysToZero = facts.stockQty > 0 && velocity > 0 ? facts.stockQty / velocity : null;
  const todayIndex = dayIndex(today);
  const unitMargin = facts.cost == null ? null : facts.price - facts.cost;
  const outOfStock = facts.stockQty <= 0;
  const daysOutOfStock =
    outOfStock && facts.lastSaleAt
      ? Math.max(0, todayIndex - dayIndex(facts.lastSaleAt.slice(0, 10)))
      : null;
  const historicalVelocity =
    facts.sold90 > 0 ? facts.sold90 / 90 : facts.soldTotal > 0 ? velocity : 0;
  return {
    ...facts,
    velocity,
    daysToZero,
    stockOutDate: daysToZero == null ? null : isoDay(todayIndex + Math.ceil(daysToZero)),
    stockValue: facts.cost == null ? null : facts.stockQty * facts.cost,
    revenuePotential: facts.stockQty * facts.price,
    daysOutOfStock,
    lostRevenueSinceStockOut:
      daysOutOfStock == null ? null : daysOutOfStock * historicalVelocity * facts.price,
    stockOutCostPerDay: outOfStock && unitMargin != null ? historicalVelocity * unitMargin : null,
  };
}

/** Rupture share and the days the whole stock covers at the current pace. */
export function inventoryHealth(rows: readonly InventoryRow[]): InventoryHealth {
  const variants = rows.length;
  const outOfStock = rows.filter((r) => r.stockQty <= 0).length;
  const stock = rows.reduce((s, r) => s + Math.max(0, r.stockQty), 0);
  const dailyVelocity = rows.reduce((s, r) => s + r.velocity, 0);
  return {
    variants,
    outOfStock,
    stockOutRate: variants > 0 ? (outOfStock / variants) * 100 : null,
    coverageDays: dailyVelocity > 0 ? stock / dailyVelocity : null,
  };
}
