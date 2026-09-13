import { SectionPage } from "@/shared/ui/SectionPage";
import type { ManagementScreen } from "@ecommerce/contracts/management";

export function Management({ data }: { data: ManagementScreen }) {
  return <SectionPage section={data.section} />;
}
