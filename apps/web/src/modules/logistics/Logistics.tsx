import type { LogisticsScreen } from "@ecommerce/contracts/logistics";
import { sectionOf } from "@/modules/consulting/contract";
import { SectionPage } from "@/shared/ui/SectionPage";
import { usePeriod } from "@/shared/hooks/usePeriod";
import { formatPeriodLabel } from "@ecommerce/contracts/shared/format";

export function Logistics({ data }: { data: LogisticsScreen }) {
  const { comparison } = usePeriod();
  const comparisonLabel = comparison
    ? `vs ${formatPeriodLabel(comparison.inicio, comparison.fim)}`
    : "sem comparação";
  return <SectionPage section={sectionOf(data.section, comparisonLabel)} />;
}
