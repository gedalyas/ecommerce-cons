import type { StoreSummary } from "@ecommerce/contracts/auth";

export function activeStoreOf(
  stores: readonly StoreSummary[],
  preferredId: string | null,
): StoreSummary | null {
  return stores.find((s) => s.id === preferredId) ?? stores[0] ?? null;
}
