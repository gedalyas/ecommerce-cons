import type { ManagementScreen } from "@ecommerce/contracts/management";
import { sectionFor } from "@/modules/consulting/contract";

export async function managementScreen(
  clientId: string,
  canEdit: boolean,
): Promise<ManagementScreen> {
  return { section: await sectionFor(clientId, "management", {}, canEdit) };
}
