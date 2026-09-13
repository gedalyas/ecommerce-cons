import { useNavigate, useSearch } from "@tanstack/react-router";
import { ChannelToggle } from "@/shared/ui/ChannelToggle";
import { PageHeader } from "@/shared/ui/PageHeader";
import { PeriodSelector } from "@/shared/ui/PeriodSelector";
import { PillarCard } from "@/shared/ui/PillarCard";
import { TabBar } from "@/shared/ui/TabBar";
import { usePeriod } from "@/shared/hooks/usePeriod";
import { layout } from "@/shared/styles/spacing";
import { cn } from "@/shared/utils/cn";
import { formatPeriodLabel } from "@ecommerce/contracts/shared/format";
import type { MoneyScreen, MoneyTab } from "@ecommerce/contracts/money";
import { sectionOf } from "@/modules/consulting/contract";
import { MoneyCosts } from "./MoneyCosts";
import { MoneyDre } from "./MoneyDre";

const tabs = [
  { key: "visao", label: "Visão" },
  { key: "dre", label: "DRE" },
  { key: "custos", label: "Custos" },
] as const;

export function Money({ data }: { data: MoneyScreen }) {
  const { period, setPeriod, comparison } = usePeriod();
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

  return (
    <div className={layout.page}>
      <PageHeader title={data.section.title} subtitle={data.section.subtitle} />

      <div className={cn(layout.headerGap, layout.blockStack)}>
        <div className="flex flex-wrap items-center gap-2">
          <PeriodSelector value={period} onChange={setPeriod} />
          <ChannelToggle value={period.canal} onChange={(canal) => setPeriod({ canal })} />
        </div>

        <TabBar tabs={tabs} value={search.aba} onChange={setTab} />

        {data.aba === "visao" && (
          <div className={layout.groupStack}>
            {sectionOf(data.section, comparisonLabel).pillars.map((pillar) => (
              <PillarCard key={pillar.title} pillar={pillar} />
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
