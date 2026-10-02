import { awaitingConsultantNotice, awaitsConsultant } from "@ecommerce/contracts/consulting";
import type { ManagementScreen } from "@ecommerce/contracts/management";
import { formatPeriodLabel } from "@ecommerce/contracts/shared/format";
import { pillarActionOf, sectionOf } from "@/modules/consulting/contract";
import { usePeriod } from "@/shared/hooks/usePeriod";
import { AlertBanner } from "@/shared/ui/AlertBanner";
import { SectionPage } from "@/shared/ui/SectionPage";

export function Management({ data }: { data: ManagementScreen }) {
  const { comparison } = usePeriod();
  const comparisonLabel = comparison
    ? `vs ${formatPeriodLabel(comparison.inicio, comparison.fim)}`
    : "sem comparação";
  return (
    <SectionPage
      section={sectionOf(data.section, comparisonLabel)}
      renderAction={pillarActionOf(data.section)}
      banner={
        awaitsConsultant(data.section) ? (
          <AlertBanner icon={false}>{awaitingConsultantNotice}</AlertBanner>
        ) : undefined
      }
    />
  );
}
