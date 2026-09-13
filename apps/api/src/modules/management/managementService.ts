import { sectionFor } from "@/modules/consulting/contract";
import type { ManagementScreen } from "@ecommerce/contracts/management";

export async function managementScreen(clientId: string): Promise<ManagementScreen> {
  return { section: await sectionFor(clientId, "management") };
}
