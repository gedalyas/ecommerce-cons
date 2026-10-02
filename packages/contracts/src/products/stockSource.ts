import { formatNumber } from "../shared/format";
import { costCoverage } from "../orders/contract";
import type { InventoryHealth, ProductRow } from "./products.types";

export function stockSourceNotice(health: Pick<InventoryHealth, "variants" | "untracked">) {
  if (health.untracked === 0) return null;
  if (health.variants === 0) {
    return "Sem fonte de estoque: conecte o Bling ou importe a planilha de produtos para ver ruptura e cobertura.";
  }
  const count = formatNumber(health.untracked);
  return health.untracked === 1
    ? "1 variante sem estoque informado fica fora da ruptura e da cobertura."
    : `${count} variantes sem estoque informado ficam fora da ruptura e da cobertura.`;
}

export function productsCostCoverage(rows: readonly Pick<ProductRow, "cost" | "revenue">[]) {
  const revenue = rows.reduce((s, r) => s + r.revenue, 0);
  const costed = rows.reduce((s, r) => s + (r.cost === null ? 0 : r.revenue), 0);
  return costCoverage(costed, revenue);
}
