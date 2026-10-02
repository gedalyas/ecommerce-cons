import type { AbcClass, AbcSummary, ProductRow, ProductSales } from "@ecommerce/contracts/products";

const A_LIMIT = 80;
const B_LIMIT = 95;

const classFor = (cumulativeShare: number): AbcClass =>
  cumulativeShare <= A_LIMIT ? "A" : cumulativeShare <= B_LIMIT ? "B" : "C";

const stockHealthOf = (p: ProductSales, windowDays: number): ProductRow["stockHealth"] => {
  if (p.stockQty === null) return null;
  if (p.stockQty <= 0) return "sem-estoque";
  const perDay = windowDays > 0 ? p.units / windowDays : 0;
  return perDay > 0 && p.stockQty / perDay < 15 ? "risco" : "ok";
};

export function classifyAbc(products: readonly ProductSales[], windowDays: number): ProductRow[] {
  const total = products.reduce((s, p) => s + p.revenue, 0);
  const sorted = [...products].sort((a, b) => b.revenue - a.revenue);
  let cumulative = 0;
  return sorted.map((p) => {
    cumulative += p.revenue;
    const share = total > 0 ? (p.revenue / total) * 100 : 0;
    const cumulativeShare = total > 0 ? (cumulative / total) * 100 : 100;
    const profit = p.cost === null ? null : p.revenue - p.cost;
    return {
      ...p,
      abcClass: p.revenue > 0 ? classFor(cumulativeShare) : "C",
      revenueShare: share,
      profit,
      averagePrice: p.units > 0 ? p.revenue / p.units : null,
      margin: profit !== null && p.revenue > 0 ? (profit / p.revenue) * 100 : null,
      stockHealth: stockHealthOf(p, windowDays),
    };
  });
}

export function summarizeAbc(rows: readonly ProductRow[]): AbcSummary[] {
  const total = rows.reduce((s, r) => s + r.revenue, 0);
  return (["A", "B", "C"] as const).map((abcClass) => {
    const group = rows.filter((r) => r.abcClass === abcClass);
    const revenue = group.reduce((s, r) => s + r.revenue, 0);
    return {
      abcClass,
      products: group.length,
      revenue,
      revenueShare: total > 0 ? (revenue / total) * 100 : 0,
    };
  });
}
