import { SectionPage } from "@/shared/ui/SectionPage";
import type { ManagementScreen } from "./management.types";

export function Management({ data }: { data: ManagementScreen }) {
  return <SectionPage section={data.section} />;
}
