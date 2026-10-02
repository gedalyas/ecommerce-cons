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
  (key.accountId == null ? [key.platform, key.date] : [key.platform, key.date, key.accountId]).join(
    KEY_SEPARATOR,
  );

export function parseAdSpendDayKey(key: string): AdSpendDayKey {
  const [platform = "", date = "", ...account] = key.split(KEY_SEPARATOR);
  return {
    platform: platform as AdPlatform,
    date,
    accountId: account.length > 0 ? account.join(KEY_SEPARATOR) : null,
  };
}

export function adSpendScopes(
  rows: readonly { platform: AdPlatform; date: string; accountId?: string }[],
): AdSpendDayKey[] {
  const scopes = new Map<string, AdSpendDayKey>();
  for (const row of rows) {
    const scope = { platform: row.platform, date: row.date, accountId: row.accountId || null };
    scopes.set(adSpendDayKey(scope), scope);
  }
  return [...scopes.values()];
}

export const scopeAccounts = (scope: AdSpendDayKey): string[] | null =>
  scope.accountId == null ? null : [scope.accountId, ""];

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
    variantsToRestore: [],
    productsToRestore: [],
    itemCostsToClear: [],
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
      case "VARIANT":
        plan.variantsToRestore.push({ variantId: entry.key, snapshot: entry.previous });
        break;
      case "PRODUCT_INFO":
        plan.productsToRestore.push({ productId: entry.key, snapshot: entry.previous });
        break;
      case "ITEM_COST":
        for (const id of entry.previous) plan.itemCostsToClear.push(id);
        break;
    }
  }
  return plan;
}
