import type { LiveKpi, LiveKpiValues } from "@ecommerce/contracts/consulting";
import type { DreIndicator } from "@ecommerce/contracts/money";

const FIDELITY_NOTE =
  "Nível B — calculado sobre pedidos pagos e as regras de custo informadas pelo cliente.";

const liveKeys = [
  "contributionMarginRate",
  "cogsRate",
  "sellingCostRate",
  "shippingCostPerOrder",
] as const;

export function moneyLiveKpis(indicators: readonly DreIndicator[]): LiveKpiValues {
  const values: LiveKpiValues = {};
  for (const key of liveKeys) {
    const indicator = indicators.find((i) => i.key === key);
    if (!indicator) continue;
    const live: LiveKpi = {
      metric: indicator.metric,
      goodWhen: indicator.goodWhen,
      fidelity: "B",
      fidelityNote: FIDELITY_NOTE,
    };
    values[key] = live;
  }
  return values;
}
