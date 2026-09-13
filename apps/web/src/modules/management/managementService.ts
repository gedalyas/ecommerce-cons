import { prismaClient } from "@ecommerce/database/client";
import { sectionFor } from "@/modules/consulting/contract.server";
import type { ManagementScreen } from "@ecommerce/contracts/management";

async function clientIdFor(slug: string) {
  const client = await prismaClient.client.findUnique({ where: { slug }, select: { id: true } });
  if (!client) throw new Error(`Unknown client "${slug}"`);
  return client.id;
}

export async function managementScreen(clientSlug: string): Promise<ManagementScreen> {
  const clientId = await clientIdFor(clientSlug);
  return { section: await sectionFor(clientId, "management") };
}
