import type { LiveKpiValues } from "@ecommerce/contracts/consulting";
import type {
  MarketingOverview,
  MarketingRetention,
  MarketingSocial,
} from "@ecommerce/contracts/marketing";
import type { MetricValue } from "@ecommerce/contracts/shared/metric.types";
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
      fidelityNote: "Nível B — investimento em marketing dividido pelo faturamento do período.",
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

function presenceKpis(social: MarketingSocial): LiveKpiValues {
  const connected = social.accounts.length > 0;
  const whenConnected = (metric: MetricValue) =>
    connected ? metric : metricValue(metric.unit, null, null);
  return {
    followers: {
      metric: whenConnected(social.followers),
      goodWhen: "up",
      fidelity: "A",
      fidelityNote: "Nível A — seguidores dos perfis conectados no último dia do período.",
      subNote: "Instagram + Facebook",
    },
    socialReach: {
      metric: whenConnected(social.reach),
      goodWhen: "up",
      fidelity: "A",
      fidelityNote: "Nível A — contas alcançadas por dia, somadas no período.",
    },
    socialEngagementRate: {
      metric: whenConnected(social.engagementRate),
      goodWhen: "up",
      fidelity: "B",
      fidelityNote: "Nível B — interações das publicações sobre o alcance do período.",
    },
  };
}

export function marketingLiveKpis(
  overview: MarketingOverview,
  retention: MarketingRetention,
  social: MarketingSocial,
): LiveKpiValues {
  return {
    ...retentionKpis(retention),
    ...acquisitionKpis(overview),
    ...presenceKpis(social),
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
