import { prismaClient } from "@ecommerce/database/client";
import { sectionFor } from "@/modules/consulting/contract.server";
import { inventoryHealthFor } from "@/modules/products/contract.server";
import type { LogisticsScreen } from "@ecommerce/contracts/logistics";

async function clientIdFor(slug: string) {
  const client = await prismaClient.client.findUnique({ where: { slug }, select: { id: true } });
  if (!client) throw new Error(`Unknown client "${slug}"`);
  return client.id;
}

export async function logisticsScreen(clientSlug: string): Promise<LogisticsScreen> {
  const clientId = await clientIdFor(clientSlug);
  const [section, inventory] = await Promise.all([
    sectionFor(clientId, "logistics"),
    inventoryHealthFor(clientId),
  ]);
  return { section, inventory };
}
