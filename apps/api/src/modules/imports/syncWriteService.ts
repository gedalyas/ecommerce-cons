import type { AdSpendRow, OrderInput, ProductSheetRow, TrafficRow } from "./importRows.types";
import {
  persistAdSpend,
  persistOrders,
  persistTraffic,
  type OrderOrigin,
} from "./importsWriteService";
import { persistProducts } from "./productsWriteService";
import { undoRecorder } from "./undoRecorder";

export function writeSyncedOrders(
  clientId: string,
  orders: OrderInput[],
  origin: OrderOrigin,
): Promise<number> {
  return persistOrders(clientId, orders, undoRecorder(), origin);
}

export function writeSyncedAdSpend(clientId: string, rows: AdSpendRow[]): Promise<number> {
  return persistAdSpend(clientId, rows, undoRecorder());
}

export function writeSyncedTraffic(clientId: string, rows: TrafficRow[]): Promise<number> {
  return persistTraffic(clientId, rows, undoRecorder());
}

export function writeSyncedProducts(
  clientId: string,
  rows: ProductSheetRow[],
  now: Date,
): Promise<number> {
  return persistProducts(clientId, rows, undoRecorder(), now);
}
