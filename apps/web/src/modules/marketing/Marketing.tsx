import { Link } from "@tanstack/react-router";
import { AlertBanner } from "@/shared/ui/AlertBanner";
import { ChannelToggle } from "@/shared/ui/ChannelToggle";
import { PageHeader } from "@/shared/ui/PageHeader";
import { PeriodSelector } from "@/shared/ui/PeriodSelector";
import { SectionPage } from "@/shared/ui/SectionPage";
import { TabBar } from "@/shared/ui/TabBar";
import type { Pillar } from "@/shared/ui/PillarCard";
import { usePeriod } from "@/shared/hooks/usePeriod";
import { layout } from "@/shared/styles/spacing";
import { cn } from "@/shared/utils/cn";
import { formatPeriodLabel } from "@ecommerce/contracts/shared/format";
import { pillarActionOf, sectionOf } from "@/modules/consulting/contract";
import { CreativePresence } from "./CreativePresence";
import type { MarketingScreen, MarketingVisao, StaleSource } from "@ecommerce/contracts/marketing";
import { MarketingCampanhas } from "./MarketingCampanhas";
import { MarketingDescontos } from "./MarketingDescontos";
import { MarketingRegioes } from "./MarketingRegioes";
import { MarketingResumo } from "./MarketingResumo";
import { MarketingSocial } from "./MarketingSocial";
import { useMarketingSearch } from "./useMarketingSearch";

const tabs = [
  { key: "visao", label: "Visão" },
  { key: "resumo", label: "Resumo" },
  { key: "campanhas", label: "Campanhas" },
  { key: "descontos", label: "Descontos" },
  { key: "regioes", label: "Regiões" },
  { key: "social", label: "Social" },
] as const;

function StaleSourceBanner({ source }: { source: StaleSource }) {
  return (
    <AlertBanner
      action={
        <Link
          to="/conexoes"
          className="text-[13px] font-semibold text-primary underline underline-offset-2"
        >
          Ir para Conexões
        </Link>
      }
    >
      {source.name} não sincroniza {source.syncLabel} — os dados de aquisição podem estar
      desatualizados.
    </AlertBanner>
  );
}

function MarketingVisaoTab({
  data,
  comparisonLabel,
}: {
  data: MarketingVisao;
  comparisonLabel: string;
}) {
  const [staleSource] = data.staleSources;
  return (
    <SectionPage
      section={sectionOf(data.section, comparisonLabel)}
      renderAction={pillarActionOf(data.section)}
      banner={staleSource ? <StaleSourceBanner source={staleSource} /> : undefined}
      renderExtra={(pillar: Pillar) =>
        pillar.extra === "creative-presence" ? <CreativePresence /> : null
      }
    />
  );
}

export function Marketing({ data }: { data: MarketingScreen }) {
  const { period, setPeriod, comparison } = usePeriod();
  const { search, patch } = useMarketingSearch();
  const comparisonLabel = comparison
    ? `vs ${formatPeriodLabel(comparison.inicio, comparison.fim)}`
    : "sem comparação";

  return (
    <div className={layout.page}>
      {data.aba !== "visao" && (
        <PageHeader
          title="Marketing"
          subtitle={`Mídia, funil e cupons em ${formatPeriodLabel(period.inicio, period.fim)}`}
        />
      )}

      <div className={cn(data.aba !== "visao" && layout.headerGap, layout.blockStack)}>
        <div className="flex flex-wrap items-center gap-2">
          <PeriodSelector value={period} onChange={setPeriod} />
          <ChannelToggle value={period.canal} onChange={(canal) => setPeriod({ canal })} />
        </div>

        <TabBar tabs={tabs} value={data.aba} onChange={(aba) => patch({ aba })} />

        {data.aba === "visao" && (
          <MarketingVisaoTab data={data} comparisonLabel={comparisonLabel} />
        )}
        {data.aba === "resumo" && (
          <MarketingResumo data={data.summary} search={search} period={period} onPatch={patch} />
        )}
        {data.aba === "campanhas" && (
          <MarketingCampanhas
            data={data.campaigns}
            search={search}
            period={period}
            onPatch={patch}
          />
        )}
        {data.aba === "descontos" && (
          <MarketingDescontos
            data={data.discounts}
            period={period}
            comparisonLabel={comparisonLabel}
          />
        )}
        {data.aba === "regioes" && (
          <MarketingRegioes data={data.regions} search={search} period={period} onPatch={patch} />
        )}
        {data.aba === "social" && (
          <MarketingSocial data={data.social} period={period} comparisonLabel={comparisonLabel} />
        )}
      </div>
    </div>
  );
}
