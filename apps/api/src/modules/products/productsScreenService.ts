import type { SalesPlatform } from "@ecommerce/database/enums";
import { ordersAggregate } from "@/modules/orders/contract";
import { PROTOTYPE_TODAY } from "@ecommerce/contracts/shared/clock";
import { metricValue } from "@ecommerce/contracts/shared/metricValue";
import type { Channel, PeriodSearch } from "@ecommerce/contracts/shared/period";
import { resolvePeriod, type Window } from "@ecommerce/contracts/shared/periodWindow";
import { classifyAbc, summarizeAbc } from "./abcClassification";
import { deriveInventory, inventoryHealth } from "./inventoryMetrics";
import type {
  InventoryHealth,
  InventoryRow,
  ProductRow,
  ProductsScreen,
  ProductsSummaryMetric,
  ProductsSearch,
} from "@ecommerce/contracts/products";
import {
  boughtTogether,
  inventoryFacts,
  productSales,
  productsFilterOptions,
  type CatalogFilters,
} from "./productsService";

const platformFor = (channel: Channel): SalesPlatform | null =>
  channel === "ecommerce" ? "ECOMMERCE" : channel === "marketplace" ? "MARKETPLACE" : null;

const filtersOf = (s: ProductsSearch): CatalogFilters => ({
  categoria: s.categoria,
  subcategoria: s.subcategoria,
  marca: s.marca,
  colecao: s.colecao,
});

const windowDays = (w: Window) => Math.round((w.end.getTime() - w.start.getTime()) / 86_400_000);

async function classifiedProducts(
  clientId: string,
  search: PeriodSearch & ProductsSearch,
  filters: CatalogFilters | null,
): Promise<{ rows: ProductRow[]; days: number }> {
  const period = resolvePeriod(search);
  const sales = await productSales(clientId, period.current, platformFor(search.canal), filters);
  const days = windowDays(period.current);
  return { rows: classifyAbc(sales, days), days };
}

async function inventoryRows(
  clientId: string,
  filters: CatalogFilters | null,
): Promise<InventoryRow[]> {
  const facts = await inventoryFacts(
    clientId,
    new Date(`${PROTOTYPE_TODAY}T00:00:00.000Z`),
    filters,
  );
  return facts.map((f) => deriveInventory(f, PROTOTYPE_TODAY));
}

const summaryDefinitions: Omit<ProductsSummaryMetric, "metric">[] = [
  { key: "productRevenue", label: "Receita de produtos", unit: "currency", goodWhen: "up" },
  { key: "units", label: "Itens vendidos", unit: "count", goodWhen: "up" },
  { key: "averageItemValue", label: "Valor médio por item", unit: "currency", goodWhen: "up" },
  { key: "itemsPerOrder", label: "Itens por pedido", unit: "count", goodWhen: "up" },
];

async function summaryMetrics(
  clientId: string,
  search: PeriodSearch,
): Promise<ProductsSummaryMetric[]> {
  const period = resolvePeriod(search);
  const platform = platformFor(search.canal);
  const [current, previous] = await Promise.all([
    ordersAggregate(clientId, period.current, platform),
    period.previous ? ordersAggregate(clientId, period.previous, platform) : null,
  ]);
  const values = (a: typeof current) => ({
    productRevenue: a.productRevenue - a.discounts,
    units: a.items,
    averageItemValue: a.items > 0 ? (a.productRevenue - a.discounts) / a.items : null,
    itemsPerOrder: a.orders > 0 ? a.items / a.orders : null,
  });
  const cur = values(current);
  const prev = previous ? values(previous) : null;
  return summaryDefinitions.map((d) => ({
    ...d,
    metric: metricValue(d.unit, cur[d.key], prev?.[d.key] ?? null),
  }));
}

export async function productsScreen(
  clientId: string,
  search: PeriodSearch & ProductsSearch,
): Promise<ProductsScreen> {
  const filters = filtersOf(search);
  switch (search.aba) {
    case "resumo": {
      const period = resolvePeriod(search);
      const [metrics, { rows }, inventory, pairs] = await Promise.all([
        summaryMetrics(clientId, search),
        classifiedProducts(clientId, search, null),
        inventoryRows(clientId, null),
        boughtTogether(clientId, period.current, platformFor(search.canal)),
      ]);
      const sold = rows.filter((r) => r.units > 0);
      return {
        aba: "resumo",
        summary: {
          metrics,
          topByVolume: [...sold].sort((a, b) => b.units - a.units).slice(0, 20),
          bottomByVolume: [...sold].sort((a, b) => a.units - b.units).slice(0, 20),
          atRisk: inventory
            .filter((r) => r.daysToZero != null && r.daysToZero <= 15)
            .sort((a, b) => a.daysToZero! - b.daysToZero!)
            .slice(0, 20),
          outOfStock: inventory
            .filter((r) => r.stockQty <= 0)
            .sort((a, b) => (b.lostRevenueSinceStockOut ?? 0) - (a.lostRevenueSinceStockOut ?? 0))
            .slice(0, 20),
          boughtTogether: pairs,
        },
      };
    }
    case "lista": {
      const [{ rows }, options] = await Promise.all([
        classifiedProducts(clientId, search, filters),
        productsFilterOptions(clientId),
      ]);
      return { aba: "lista", list: { abc: summarizeAbc(rows), rows, options } };
    }
    case "estoque": {
      const [rows, options] = await Promise.all([
        inventoryRows(clientId, filters),
        productsFilterOptions(clientId),
      ]);
      return { aba: "estoque", inventory: { rows, options } };
    }
  }
}

/** Rupture share and coverage for Logística, over the whole catalog. */
export async function inventoryHealthFor(clientId: string): Promise<InventoryHealth> {
  return inventoryHealth(await inventoryRows(clientId, null));
}
