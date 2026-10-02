import type { LiveKpiValues } from "@ecommerce/contracts/consulting";
import { metricValue } from "@ecommerce/contracts/shared/metricValue";
import type { Concentration } from "./revenueConcentration";

export function managementLiveKpis(
  current: Concentration,
  previous: Concentration | null,
): LiveKpiValues {
  return {
    revenueConcentration: {
      metric: metricValue("percent", current.share, previous?.share ?? null),
      goodWhen: "down",
      fidelity: "A",
      fidelityNote: "Nível A — receita paga do período por canal de venda.",
      subNote: current.channel
        ? `${current.channel} é o maior canal do período`
        : "Sem vendas pagas no período",
    },
  };
}
