import type { AdPlatform } from "@ecommerce/database/enums";
import type {
  AdSpendDayKey,
  TrafficKey,
  UndoEntity,
  UndoEntry,
  UndoPlan,
} from "./importUndo.types";
import { undoEntities } from "./importUndo.types";

const KEY_SEPARATOR = "|";

export const adSpendDayKey = (key: AdSpendDayKey): string =>
  [key.platform, key.date].join(KEY_SEPARATOR);

export function parseAdSpendDayKey(key: string): AdSpendDayKey {
  const [platform = "", date = ""] = key.split(KEY_SEPARATOR);
  return { platform: platform as AdPlatform, date };
}

export const trafficKey = (key: TrafficKey): string =>
  [key.date, key.source, key.medium].join(KEY_SEPARATOR);

export function parseTrafficKey(key: string): TrafficKey {
  const [date = "", source = "", ...medium] = key.split(KEY_SEPARATOR);
  return { date, source, medium: medium.join(KEY_SEPARATOR) };
}

export function isUndoEntity(value: string): value is UndoEntity {
  return (undoEntities as readonly string[]).includes(value);
}

export function undoPlanOf(entries: UndoEntry[]): UndoPlan {
  const plan: UndoPlan = {
    ordersToDelete: [],
    ordersToRestore: [],
    customersToDelete: [],
    customersToRename: [],
    productsToDelete: [],
    adSpendDays: [],
    traffic: [],
  };
  for (const entry of entries) {
    switch (entry.entity) {
      case "ORDER":
        if (entry.previous)
          plan.ordersToRestore.push({ number: entry.key, snapshot: entry.previous });
        else plan.ordersToDelete.push(entry.key);
        break;
      case "CUSTOMER":
        if (entry.previous)
          plan.customersToRename.push({ email: entry.key, name: entry.previous.name });
        else plan.customersToDelete.push(entry.key);
        break;
      case "PRODUCT":
        plan.productsToDelete.push(entry.key);
        break;
      case "AD_SPEND_DAY":
        plan.adSpendDays.push({ key: parseAdSpendDayKey(entry.key), rows: entry.previous ?? [] });
        break;
      case "TRAFFIC":
        plan.traffic.push({ key: parseTrafficKey(entry.key), previous: entry.previous });
        break;
    }
  }
  return plan;
}
