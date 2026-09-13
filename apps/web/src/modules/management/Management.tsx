import type { ManagementScreen } from "@ecommerce/contracts/management";
import { sectionOf } from "@/modules/consulting/contract";
import { SectionPage } from "@/shared/ui/SectionPage";

export function Management({ data }: { data: ManagementScreen }) {
  return <SectionPage section={sectionOf(data.section, "sem comparação")} />;
}
