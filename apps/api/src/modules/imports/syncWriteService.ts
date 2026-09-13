import type { AdSpendRow, OrderInput, TrafficRow } from "./importRows.types";
import { persistAdSpend, persistOrders, persistTraffic } from "./importsWriteService";
import { undoRecorder } from "./undoRecorder";

export function writeSyncedOrders(clientId: string, orders: OrderInput[]): Promise<number> {
  return persistOrders(clientId, orders, undoRecorder());
}

export function writeSyncedAdSpend(clientId: string, rows: AdSpendRow[]): Promise<number> {
  return persistAdSpend(clientId, rows, undoRecorder());
}

export function writeSyncedTraffic(clientId: string, rows: TrafficRow[]): Promise<number> {
  return persistTraffic(clientId, rows, undoRecorder());
}
