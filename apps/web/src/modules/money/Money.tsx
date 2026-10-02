import { useNavigate, useSearch } from "@tanstack/react-router";
import { AlertBanner } from "@/shared/ui/AlertBanner";
import { PageHeader } from "@/shared/ui/PageHeader";
import { PillarCard } from "@/shared/ui/PillarCard";
import { TabBar } from "@/shared/ui/TabBar";
import { usePeriod } from "@/shared/hooks/usePeriod";
import { layout } from "@/shared/styles/spacing";
import { cn } from "@/shared/utils/cn";
import { formatPeriodLabel } from "@ecommerce/contracts/shared/format";
import type { MoneyScreen, MoneyTab } from "@ecommerce/contracts/money";
import { costCoverageNotice } from "@ecommerce/contracts/orders";
import { pillarActionOf, sectionOf } from "@/modules/consulting/contract";
import { ProductsSheetLink } from "@/modules/imports/contract";
import { MoneyCosts } from "./MoneyCosts";
import { MoneyDre } from "./MoneyDre";

const tabs = [
  { key: "visao", label: "Visão" },
  { key: "dre", label: "DRE" },
  { key: "custos", label: "Custos" },
] as const;

export function Money({ data }: { data: MoneyScreen }) {
  const { period, comparison } = usePeriod();
  const search = useSearch({ from: "/dinheiro" });
  const navigate = useNavigate();
  const setTab = (aba: MoneyTab) =>
    void navigate({
      to: "/dinheiro",
      search: (prev: Record<string, unknown>) => ({ ...prev, aba }),
      replace: true,
    });
  const comparisonLabel = comparison
    ? `vs ${formatPeriodLabel(comparison.inicio, comparison.fim)}`
    : "sem comparação";
  const costNotice =
    data.aba === "visao"
      ? costCoverageNotice(data.costCoverage)
      : data.aba === "dre"
        ? costCoverageNotice(data.dre.costCoverage)
        : null;

  return (
    <div className={layout.page}>
      <PageHeader title={data.section.title} subtitle={data.section.subtitle} />

      <div className={cn(layout.headerGap, layout.blockStack)}>
        <TabBar tabs={tabs} value={search.aba} onChange={setTab} />

        {costNotice && <AlertBanner action={<ProductsSheetLink />}>{costNotice}</AlertBanner>}

        {data.aba === "visao" && (
          <div className={layout.groupStack}>
            {sectionOf(data.section, comparisonLabel).pillars.map((pillar) => (
              <PillarCard
                key={pillar.title}
                pillar={pillar}
                actionSlot={pillarActionOf(data.section)(pillar)}
              />
            ))}
          </div>
        )}
        {data.aba === "dre" && (
          <MoneyDre data={data.dre} period={period} comparisonLabel={comparisonLabel} />
        )}
        {data.aba === "custos" && <MoneyCosts rules={data.rules} />}
      </div>
    </div>
  );
}
