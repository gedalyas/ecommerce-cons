import type { ManagementScreen } from "@ecommerce/contracts/management";
import type { PeriodSearch } from "@ecommerce/contracts/shared/period";
import { resolvePeriod } from "@ecommerce/contracts/shared/periodWindow";
import { sectionFor } from "@/modules/consulting/contract";
import { salesByChannel } from "@/modules/orders/contract";
import { managementLiveKpis } from "./managementLiveKpis";
import { revenueConcentration } from "./revenueConcentration";

export async function managementScreen(
  clientId: string,
  search: PeriodSearch,
  canEdit: boolean,
): Promise<ManagementScreen> {
  const period = resolvePeriod(search);
  const [current, previous] = await Promise.all([
    salesByChannel(clientId, period.current),
    period.previous ? salesByChannel(clientId, period.previous) : null,
  ]);
  const live = managementLiveKpis(
    revenueConcentration(current),
    previous ? revenueConcentration(previous) : null,
  );
  return { section: await sectionFor(clientId, "management", live, canEdit) };
}
