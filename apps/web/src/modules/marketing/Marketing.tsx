import { Link } from "@tanstack/react-router";
import { AlertBanner } from "@/shared/ui/AlertBanner";
import { ChannelToggle } from "@/shared/ui/ChannelToggle";
import { PageHeader } from "@/shared/ui/PageHeader";
import { PeriodSelector } from "@/shared/ui/PeriodSelector";
import { SectionPage } from "@/shared/ui/SectionPage";
import { TabBar } from "@/shared/ui/TabBar";
import type { Pillar } from "@/shared/ui/PillarCard";
import type { Metric } from "@/shared/ui/metricTile.types";
import { metricToTile } from "@/shared/ui/metricToTile";
import { usePeriod } from "@/shared/hooks/usePeriod";
import { layout } from "@/shared/styles/spacing";
import { cn } from "@/shared/utils/cn";
import { formatCurrency, formatPeriodLabel, formatPercent } from "@/shared/utils/format";
import type { MetricValue } from "@ecommerce/contracts/shared/metric.types";
import { CreativePresence } from "./CreativePresence";
import type {
  MarketingOverview,
  MarketingRetention,
  MarketingScreen,
  MarketingVisao,
  StaleSource,
} from "@ecommerce/contracts/marketing";
import { MarketingCampanhas } from "./MarketingCampanhas";
import { MarketingDescontos } from "./MarketingDescontos";
import { MarketingRegioes } from "./MarketingRegioes";
import { MarketingResumo } from "./MarketingResumo";
import { useMarketingSearch } from "./useMarketingSearch";

const tabs = [
  { key: "visao", label: "Visão" },
  { key: "resumo", label: "Resumo" },
  { key: "campanhas", label: "Campanhas" },
  { key: "descontos", label: "Descontos" },
  { key: "regioes", label: "Regiões" },
] as const;

type LiveKpi = {
  metric: MetricValue;
  goodWhen: "up" | "down";
  fidelity: Metric["fidelity"];
  fidelityNote: string;
  subNote?: string;
};

function liveKpis(overview: MarketingOverview): Record<string, LiveKpi> {
  return {
    "Taxa de conversão": {
      metric: overview.conversionRate,
      goodWhen: "up",
      fidelity: "A",
      fidelityNote: "Nível A — pedidos pagos da loja sobre as sessões do site.",
    },
    "Ticket médio": {
      metric: overview.aov,
      goodWhen: "up",
      fidelity: "A",
      fidelityNote: "Nível A — receita dividida por pedidos pagos.",
    },
    "Abandono de carrinho": {
      metric: overview.cartAbandonment,
      goodWhen: "down",
      fidelity: "B",
      fidelityNote: "Nível B — carrinhos sem pedido pago; eventos com perda parcial no mobile.",
    },
    CAC: {
      metric: overview.cac,
      goodWhen: "down",
      fidelity: "B",
      fidelityNote: "Nível B — investimento em marketing dividido por novos clientes.",
    },
    "ROAS geral": {
      metric: overview.roas,
      goodWhen: "up",
      fidelity: "B",
      fidelityNote: "Nível B — receita total sobre o investimento em marketing.",
    },
    "Investimento em mídia": {
      metric: overview.adSpend,
      goodWhen: "down",
      fidelity: "A",
      fidelityNote: "Nível A — mídia paga das plataformas mais as regras de custo de marketing.",
    },
    "Participação do maior canal": {
      metric: overview.topChannelShare,
      goodWhen: "down",
      fidelity: "A",
      fidelityNote: "Nível A — receita paga por origem / meio.",
      ...(overview.topChannel ? { subNote: overview.topChannel } : {}),
    },
  };
}

function withLiveKpis(
  kpis: Metric[],
  live: Record<string, LiveKpi>,
  retention: MarketingRetention,
  comparisonLabel: string,
): Metric[] {
  return kpis.map((kpi) => {
    const l = live[kpi.label];
    if (l && l.metric.value != null) {
      const tile = metricToTile({
        label: kpi.label,
        metric: l.metric,
        comparisonLabel,
        goodWhen: l.goodWhen,
        fidelity: l.fidelity,
        fidelityNote: l.fidelityNote,
      });
      return l.subNote ? { ...tile, subNote: l.subNote } : tile;
    }
    if (kpi.label === "Recompra 90 dias" && retention.repurchaseRate90 != null) {
      return {
        ...kpi,
        value: formatPercent(retention.repurchaseRate90),
        subNote: "pedidos de recompra sobre pedidos pagos, últimos 90 dias",
        fidelity: "A",
        fidelityNote: "Nível A — pedidos pagos ordenados por cliente ao longo do histórico.",
      };
    }
    if (kpi.label === "LTV 12 meses" && retention.ltv12Months != null) {
      return {
        ...kpi,
        value: formatCurrency(retention.ltv12Months),
        subNote: "receita média por cliente adquirido nos últimos 12 meses",
        fidelity: "B",
        fidelityNote: "Nível B — coorte dos últimos 12 meses ainda em andamento.",
      };
    }
    return kpi;
  });
}

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
  retention,
  comparisonLabel,
}: {
  data: MarketingVisao;
  retention: MarketingRetention;
  comparisonLabel: string;
}) {
  const live = liveKpis(data.overview);
  const [staleSource] = data.staleSources;
  const section = {
    ...data.section,
    pillars: data.section.pillars.map((pillar) => ({
      ...pillar,
      kpis: withLiveKpis(pillar.kpis, live, retention, comparisonLabel),
    })),
  };
  return (
    <SectionPage
      section={section}
      banner={staleSource ? <StaleSourceBanner source={staleSource} /> : undefined}
      renderExtra={(pillar: Pillar) =>
        pillar.extra === "creative-presence" ? <CreativePresence /> : null
      }
    />
  );
}

export function Marketing({
  data,
  retention,
}: {
  data: MarketingScreen;
  retention: MarketingRetention;
}) {
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
          subtitle={`Mídia, funil e cupons em ${formatPeriodLabel(period.inicio, period.fim)} · Loja Aurora`}
        />
      )}

      <div className={cn(data.aba !== "visao" && layout.headerGap, layout.blockStack)}>
        <div className="flex flex-wrap items-center gap-2">
          <PeriodSelector value={period} onChange={setPeriod} />
          <ChannelToggle value={period.canal} onChange={(canal) => setPeriod({ canal })} />
        </div>

        <TabBar tabs={tabs} value={data.aba} onChange={(aba) => patch({ aba })} />

        {data.aba === "visao" && (
          <MarketingVisaoTab data={data} retention={retention} comparisonLabel={comparisonLabel} />
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
      </div>
    </div>
  );
}
