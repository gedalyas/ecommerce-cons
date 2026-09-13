/**
 * Logistics orchestrator: what the pillars read from other modules. Server-only.
 */
import { prismaClient } from "@/shared/dependencies/prismaClient";
import { inventoryHealthFor } from "@/modules/products/contract.server";
import type { InventoryHealth } from "@/modules/products/contract";

async function clientIdFor(slug: string) {
  const client = await prismaClient.client.findUnique({ where: { slug }, select: { id: true } });
  if (!client) throw new Error(`Unknown client "${slug}"`);
  return client.id;
}

export async function logisticsScreen(clientSlug: string): Promise<{ inventory: InventoryHealth }> {
  const clientId = await clientIdFor(clientSlug);
  return { inventory: await inventoryHealthFor(clientId) };
}
