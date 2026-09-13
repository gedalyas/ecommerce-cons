import { Link } from "@tanstack/react-router";
import { AlertBanner } from "@/shared/ui/AlertBanner";
import { SectionPage } from "@/shared/ui/SectionPage";
import type { Pillar } from "@/shared/ui/PillarCard";
import type { Metric } from "@/shared/ui/metricTile.types";
import { formatCurrency, formatPercent } from "@/shared/utils/format";
import { CreativePresence } from "./CreativePresence";
import { marketingSection } from "./marketingFixture";

/**
 * What the Retenção pillar needs from the customer base. Declared here (the
 * consumer) and filled by the route from the customers contract, so marketing
 * never imports customers - customers already depends on marketing for the
 * ad spend behind CAC, and the cycle ratchet is at zero.
 */
export type MarketingRetention = { repurchaseRate90: number | null; ltv12Months: number | null };

/** Fixture KPIs of the Retenção pillar replaced by the live base. */
function withLiveKpis(kpis: Metric[], retention: MarketingRetention): Metric[] {
  return kpis.map((kpi) => {
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

export function Marketing({ retention }: { retention: MarketingRetention }) {
  const section = {
    ...marketingSection,
    pillars: marketingSection.pillars.map((pillar) => ({
      ...pillar,
      kpis: withLiveKpis(pillar.kpis, retention),
    })),
  };
  return (
    <SectionPage
      section={section}
      banner={
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
          Meta Ads não sincroniza há 6 dias — os dados de aquisição podem estar desatualizados.
        </AlertBanner>
      }
      renderExtra={(pillar: Pillar) =>
        pillar.extra === "creative-presence" ? <CreativePresence /> : null
      }
    />
  );
}
