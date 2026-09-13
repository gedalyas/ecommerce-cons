import type { LiveKpiValues } from "@ecommerce/contracts/consulting";
import type { LogisticsScreen } from "@ecommerce/contracts/logistics";
import type { InventoryHealth } from "@ecommerce/contracts/products";
import { formatNumber } from "@ecommerce/contracts/shared/format";
import { metricValue } from "@ecommerce/contracts/shared/metricValue";
import { sectionFor } from "@/modules/consulting/contract";
import { inventoryHealthFor } from "@/modules/products/contract";

export function logisticsLiveKpis(inventory: InventoryHealth): LiveKpiValues {
  return {
    stockOutRate: {
      metric: metricValue("percent", inventory.stockOutRate, null),
      goodWhen: "down",
      fidelity: "A",
      fidelityNote: "Nível A — saldo de estoque por variante sincronizado da plataforma.",
      subNote: `${formatNumber(inventory.outOfStock)} de ${formatNumber(inventory.variants)} variantes zeradas`,
    },
    coverageDays: {
      metric: metricValue("days", inventory.coverageDays, null),
      goodWhen: "up",
      fidelity: "B",
      fidelityNote: "Nível B — média de saída dos últimos 30 dias sobre o saldo atual.",
      subNote: "estoque total ÷ vendas diárias dos últimos 30 dias",
    },
  };
}

export async function logisticsScreen(
  clientId: string,
  canEdit: boolean,
): Promise<LogisticsScreen> {
  const inventory = await inventoryHealthFor(clientId);
  const section = await sectionFor(clientId, "logistics", logisticsLiveKpis(inventory), canEdit);
  return { section, inventory };
}
