import { useNavigate, useSearch } from "@tanstack/react-router";
import { ChannelToggle } from "@/shared/ui/ChannelToggle";
import { PageHeader } from "@/shared/ui/PageHeader";
import { PeriodSelector } from "@/shared/ui/PeriodSelector";
import { PillarCard } from "@/shared/ui/PillarCard";
import { TabBar } from "@/shared/ui/TabBar";
import { metricToTile } from "@/shared/ui/metricToTile";
import type { Metric } from "@/shared/ui/metricTile.types";
import { usePeriod } from "@/shared/hooks/usePeriod";
import { layout } from "@/shared/styles/spacing";
import { cn } from "@/shared/utils/cn";
import { formatPeriodLabel } from "@/shared/utils/format";
import type { DreIndicator, MoneyScreen } from "./money.types";
import { MoneyCosts } from "./MoneyCosts";
import { MoneyDre } from "./MoneyDre";
import type { MoneyTab } from "./moneySchema";

const tabs = [
  { key: "visao", label: "Visão" },
  { key: "dre", label: "DRE" },
  { key: "custos", label: "Custos" },
] as const;

const liveKpi: Record<string, DreIndicator["key"]> = {
  "Margem de contribuição": "contributionMarginRate",
  CMV: "cogsRate",
  "Taxa média do adquirente": "sellingCostRate",
  "Custo de frete / pedido": "shippingCostPerOrder",
};

function withLiveKpis(kpis: Metric[], indicators: DreIndicator[], comparisonLabel: string) {
  return kpis.map((kpi) => {
    const key = liveKpi[kpi.label];
    const indicator = key ? indicators.find((i) => i.key === key) : undefined;
    return indicator
      ? metricToTile({
          label: kpi.label,
          metric: indicator.metric,
          comparisonLabel,
          goodWhen: indicator.goodWhen,
          fidelity: "B",
          fidelityNote:
            "Nível B — calculado sobre pedidos pagos e as regras de custo informadas pelo cliente.",
        })
      : kpi;
  });
}

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
            {data.section.pillars.map((pillar) => (
              <PillarCard
                key={pillar.title}
                pillar={{
                  ...pillar,
                  kpis: withLiveKpis(pillar.kpis, data.indicators, comparisonLabel),
                }}
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
