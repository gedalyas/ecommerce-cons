import type { LiveKpiValues } from "@ecommerce/contracts/consulting";
import type { MarketingOverview, MarketingRetention } from "@ecommerce/contracts/marketing";
import { metricValue } from "@ecommerce/contracts/shared/metricValue";

function retentionKpis(retention: MarketingRetention): LiveKpiValues {
  return {
    repurchaseRate90: {
      metric: metricValue("percent", retention.repurchaseRate90, null),
      goodWhen: "up",
      fidelity: "A",
      fidelityNote: "Nível A — pedidos pagos ordenados por cliente ao longo do histórico.",
      subNote: "pedidos de recompra sobre pedidos pagos, últimos 90 dias",
    },
    ltv12Months: {
      metric: metricValue("currency", retention.ltv12Months, null),
      goodWhen: "up",
      fidelity: "B",
      fidelityNote: "Nível B — coorte dos últimos 12 meses ainda em andamento.",
      subNote: "receita média por cliente adquirido nos últimos 12 meses",
    },
  };
}

function acquisitionKpis(overview: MarketingOverview): LiveKpiValues {
  return {
    cac: {
      metric: overview.cac,
      goodWhen: "down",
      fidelity: "B",
      fidelityNote: "Nível B — investimento em marketing dividido por novos clientes.",
    },
    roas: {
      metric: overview.roas,
      goodWhen: "up",
      fidelity: "B",
      fidelityNote: "Nível B — receita total sobre o investimento em marketing.",
    },
    adSpend: {
      metric: overview.adSpend,
      goodWhen: "down",
      fidelity: "A",
      fidelityNote: "Nível A — mídia paga das plataformas mais as regras de custo de marketing.",
    },
    topChannelShare: {
      metric: overview.topChannelShare,
      goodWhen: "down",
      fidelity: "A",
      fidelityNote: "Nível A — receita paga por origem / meio.",
      ...(overview.topChannel ? { subNote: overview.topChannel } : {}),
    },
  };
}

export function marketingLiveKpis(
  overview: MarketingOverview,
  retention: MarketingRetention,
): LiveKpiValues {
  return {
    ...retentionKpis(retention),
    ...acquisitionKpis(overview),
    conversionRate: {
      metric: overview.conversionRate,
      goodWhen: "up",
      fidelity: "A",
      fidelityNote: "Nível A — pedidos pagos da loja sobre as sessões do site.",
    },
    aov: {
      metric: overview.aov,
      goodWhen: "up",
      fidelity: "A",
      fidelityNote: "Nível A — receita dividida por pedidos pagos.",
    },
    cartAbandonment: {
      metric: overview.cartAbandonment,
      goodWhen: "down",
      fidelity: "B",
      fidelityNote: "Nível B — carrinhos sem pedido pago; eventos com perda parcial no mobile.",
    },
  };
}
