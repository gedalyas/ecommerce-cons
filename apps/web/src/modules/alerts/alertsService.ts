import { PROTOTYPE_TODAY } from "@ecommerce/contracts/shared/clock";
import { trafficAggregate } from "@/modules/marketing/contract.server";
import { ordersAggregate } from "@/modules/orders/contract.server";
import { inventoryFacts, productSales } from "@/modules/products/contract.server";
import { toWindow, type Window } from "@ecommerce/contracts/shared/periodWindow";
import { deriveAlerts } from "./alertRules";
import type { AlertFacts, AlertItem, ProductWeekPair } from "@ecommerce/contracts/alerts";

const DAY = 86_400_000;

const isoDaysAgo = (today: string, days: number) =>
  new Date(new Date(`${today}T00:00:00.000Z`).getTime() - days * DAY).toISOString().slice(0, 10);

export const weekWindows = (today: string): { current: Window; previous: Window } => ({
  current: toWindow({ inicio: isoDaysAgo(today, 6), fim: today }),
  previous: toWindow({ inicio: isoDaysAgo(today, 13), fim: isoDaysAgo(today, 7) }),
});

const productPairs = (
  current: { name: string; units: number }[],
  previous: { name: string; units: number }[],
): ProductWeekPair[] => {
  const before = new Map(previous.map((p) => [p.name, p.units]));
  return current.map((p) => ({
    name: p.name,
    current: p.units,
    previous: before.get(p.name) ?? 0,
  }));
};

export async function alertFactsFor(
  clientId: string,
  today = PROTOTYPE_TODAY,
): Promise<AlertFacts> {
  const { current, previous } = weekWindows(today);
  const [orders, ordersBefore, traffic, trafficBefore, products, productsBefore, variants] =
    await Promise.all([
      ordersAggregate(clientId, current, null),
      ordersAggregate(clientId, previous, null),
      trafficAggregate(clientId, current),
      trafficAggregate(clientId, previous),
      productSales(clientId, current, null, null),
      productSales(clientId, previous, null, null),
      inventoryFacts(clientId, new Date(`${today}T00:00:00.000Z`), null),
    ]);
  return {
    revenue: { current: orders.revenue, previous: ordersBefore.revenue },
    sessions: { current: traffic.sessions, previous: trafficBefore.sessions },
    products: productPairs(products, productsBefore),
    variants: variants.map((v) => ({
      productName: v.productName,
      variantName: v.variantName,
      sku: v.sku,
      stockQty: v.stockQty,
      sold30: v.sold30,
      sold90: v.sold90,
    })),
  };
}

export async function alertsFor(clientId: string, today = PROTOTYPE_TODAY): Promise<AlertItem[]> {
  return deriveAlerts(await alertFactsFor(clientId, today));
}
