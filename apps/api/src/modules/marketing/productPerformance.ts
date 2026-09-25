import type { ProductPerformanceRow } from "@ecommerce/contracts/marketing";

export type ItemSums = {
  key: string;
  productId: string | null;
  name: string;
  views: number;
  addToCart: number;
  purchases: number;
};

export type SiteSales = { productId: string; units: number; revenue: number };

const share = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : null);

export function productPerformance(
  items: readonly ItemSums[],
  sales: readonly SiteSales[],
): ProductPerformanceRow[] {
  const byProduct = new Map(sales.map((s) => [s.productId, s]));
  return items.map(({ productId, ...item }) => {
    const sale = productId ? byProduct.get(productId) : undefined;
    return {
      ...item,
      cartRate: share(item.addToCart, item.views),
      purchaseRate: share(item.purchases, item.views),
      units: productId ? (sale?.units ?? 0) : null,
      revenue: productId ? (sale?.revenue ?? 0) : null,
    };
  });
}
