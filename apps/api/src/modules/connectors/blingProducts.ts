import { isMoneyInRange, isStockInRange, productTextLimits } from "@ecommerce/contracts/imports";
import type { ProductSheetRow } from "@/modules/imports/contract";

export type BlingProduct = {
  id: number | string;
  codigo?: string | null;
  nome?: string | null;
  preco?: number | string | null;
  precoCusto?: number | string | null;
  estoque?: { saldoVirtualTotal?: number | string | null } | null;
};

export type BlingCategory = { id: number | string; descricao?: string | null };

const PRODUCTS_EVERY_MS = 6 * 60 * 60 * 1000;

const numberOf = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const money = (value: number | null) =>
  value !== null && value > 0 && isMoneyInRange(value) ? value : null;

export const productsDue = (lastPulledAt: string | undefined, now: Date) =>
  !lastPulledAt || now.getTime() - new Date(lastPulledAt).getTime() >= PRODUCTS_EVERY_MS;

const skuOf = (product: BlingProduct) => {
  const sku = product.codigo?.trim();
  return sku && sku.length <= productTextLimits.sku ? sku : null;
};

export function skuCategories(
  listed: readonly { category: BlingCategory; products: readonly BlingProduct[] }[],
): Map<string, string> {
  const bySku = new Map<string, string>();
  for (const { category, products } of listed) {
    const name = category.descricao?.trim().slice(0, productTextLimits.category);
    if (!name) continue;
    for (const product of products) {
      const sku = skuOf(product);
      if (sku) bySku.set(sku, name);
    }
  }
  return bySku;
}

function blingProductRowOf(product: BlingProduct, category: string | null): ProductSheetRow | null {
  const sku = skuOf(product);
  if (!sku) return null;
  const balance = numberOf(product.estoque?.saldoVirtualTotal);
  const stock = balance === null ? null : Math.round(balance);
  return {
    row: 0,
    sku,
    name: product.nome?.trim().slice(0, productTextLimits.name) || null,
    category,
    cost: money(numberOf(product.precoCusto)),
    stock: isStockInRange(stock) ? stock : null,
    price: money(numberOf(product.preco)),
  };
}

export function blingProductRows(
  products: readonly BlingProduct[],
  categories: ReadonlyMap<string, string>,
): ProductSheetRow[] {
  const bySku = new Map<string, ProductSheetRow>();
  for (const product of products) {
    const row = blingProductRowOf(product, categories.get(skuOf(product) ?? "") ?? null);
    if (row) bySku.set(row.sku, row);
  }
  return [...bySku.values()];
}
