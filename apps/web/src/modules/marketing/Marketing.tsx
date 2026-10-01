import { Link } from "@tanstack/react-router";
import { AlertBanner } from "@/shared/ui/AlertBanner";
import { PageHeader } from "@/shared/ui/PageHeader";
import { SectionPage } from "@/shared/ui/SectionPage";
import { TabBar } from "@/shared/ui/TabBar";
import { usePeriod } from "@/shared/hooks/usePeriod";
import { layout } from "@/shared/styles/spacing";
import { cn } from "@/shared/utils/cn";
import { formatPeriodLabel } from "@ecommerce/contracts/shared/format";
import { pillarActionOf, sectionOf } from "@/modules/consulting/contract";
import type { MarketingPayload, MarketingVisao, StaleSource } from "@ecommerce/contracts/marketing";
import { MarketingCampanhas } from "./MarketingCampanhas";
import { MarketingCanais } from "./MarketingCanais";
import { MarketingDescontos } from "./MarketingDescontos";
import { MarketingFunil } from "./MarketingFunil";
import { MarketingGeral } from "./MarketingGeral";
import { MarketingPlataforma } from "./MarketingPlataforma";
import { MarketingRegioes } from "./MarketingRegioes";
import { MarketingResumo } from "./MarketingResumo";
import { MarketingSite } from "./MarketingSite";
import { MarketingSocial } from "./MarketingSocial";
import { SourceStamps } from "./SourceStamps";
import { useMarketingSearch } from "./useMarketingSearch";

const tabs = [
  { key: "geral", label: "Visão geral" },
  { key: "meta", label: "Meta Ads" },
  { key: "google", label: "Google Ads" },
  { key: "site", label: "Site" },
  { key: "canais", label: "Vendas por canal" },
  { key: "funil", label: "Funil de investimento" },
  { key: "visao", label: "Pilares" },
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
          to="/integracoes"
          className="text-[13px] font-semibold text-primary underline underline-offset-2"
        >
          Ir para Integrações
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
    />
  );
}

export function Marketing({ data }: { data: MarketingPayload }) {
  const { period, comparison } = usePeriod();
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
        <TabBar tabs={tabs} value={data.aba} onChange={(aba) => patch({ aba })} />
        <SourceStamps sources={data.sources} />

        {data.aba === "geral" && (
          <MarketingGeral
            data={data.general}
            search={search}
            period={period}
            comparisonLabel={comparisonLabel}
            onPatch={patch}
          />
        )}
        {(data.aba === "meta" || data.aba === "google") && (
          <MarketingPlataforma
            data={data.platformTab}
            search={search}
            period={period}
            comparisonLabel={comparisonLabel}
            onPatch={patch}
          />
        )}
        {data.aba === "site" && (
          <MarketingSite
            data={data.site}
            search={search}
            period={period}
            comparisonLabel={comparisonLabel}
            onPatch={patch}
          />
        )}
        {data.aba === "canais" && <MarketingCanais data={data.salesChannels} period={period} />}
        {data.aba === "funil" && (
          <MarketingFunil
            data={data.funnel}
            search={search}
            period={period}
            comparisonLabel={comparisonLabel}
            onPatch={patch}
          />
        )}
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
