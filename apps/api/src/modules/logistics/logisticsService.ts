import { sectionFor } from "@/modules/consulting/contract";
import { inventoryHealthFor } from "@/modules/products/contract";
import type { LogisticsScreen } from "@ecommerce/contracts/logistics";

export async function logisticsScreen(clientId: string): Promise<LogisticsScreen> {
  const [section, inventory] = await Promise.all([
    sectionFor(clientId, "logistics"),
    inventoryHealthFor(clientId),
  ]);
  return { section, inventory };
}
