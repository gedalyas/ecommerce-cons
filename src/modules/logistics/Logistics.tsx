import type { InventoryHealth } from "@/modules/products/contract";
import { SectionPage } from "@/shared/ui/SectionPage";
import type { Metric } from "@/shared/ui/metricTile.types";
import { formatNumber, formatPercent } from "@/shared/utils/format";
import { logisticsSection } from "./logisticsFixture";

/** Fixture KPIs replaced by the live stock position (`products` module). */
function withLiveKpis(kpis: Metric[], inventory: InventoryHealth): Metric[] {
  return kpis.map((kpi) => {
    if (kpi.label === "Ruptura de estoque" && inventory.stockOutRate != null) {
      return {
        ...kpi,
        value: formatPercent(inventory.stockOutRate),
        subNote: `${formatNumber(inventory.outOfStock)} de ${formatNumber(inventory.variants)} variantes zeradas`,
        fidelity: "A",
        fidelityNote: "Nível A — saldo de estoque por variante sincronizado do ERP.",
      };
    }
    if (kpi.label === "Cobertura de estoque" && inventory.coverageDays != null) {
      return {
        ...kpi,
        value: `${formatNumber(inventory.coverageDays)} dias`,
        subNote: "estoque total ÷ vendas diárias dos últimos 30 dias",
        fidelity: "B",
        fidelityNote: "Nível B — média de saída dos últimos 30 dias sobre o saldo atual.",
      };
    }
    return kpi;
  });
}

export function Logistics({ data }: { data: { inventory: InventoryHealth } }) {
  const section = {
    ...logisticsSection,
    pillars: logisticsSection.pillars.map((pillar) => ({
      ...pillar,
      kpis: withLiveKpis(pillar.kpis, data.inventory),
    })),
  };
  return <SectionPage section={section} />;
}
