export const dashboardWidgetKinds = [
  "headline",
  "indicator",
  "revenueVsInvestment",
  "channelSplit",
  "bySource",
  "topProducts",
  "customerMix",
  "funnel",
  "paidMedia",
  "matrix",
  "alerts",
  "milestone",
  "recommendations",
] as const;

export type DashboardWidgetKind = (typeof dashboardWidgetKinds)[number];

export type DashboardWidgetDefinition = {
  kind: DashboardWidgetKind;
  label: string;
  description: string;
};

export const dashboardWidgetCatalog: Record<DashboardWidgetKind, DashboardWidgetDefinition> = {
  headline: {
    kind: "headline",
    label: "Indicadores em destaque",
    description: "Faturamento, margem, CAC e recompra com a variação do período.",
  },
  indicator: {
    kind: "indicator",
    label: "Evolução do indicador",
    description: "Escolha um indicador e veja a curva do período contra a comparação.",
  },
  revenueVsInvestment: {
    kind: "revenueVsInvestment",
    label: "Receita × investimento",
    description: "Quanto entrou de receita para cada real investido em marketing, por período.",
  },
  channelSplit: {
    kind: "channelSplit",
    label: "Vendas por canal",
    description: "E-commerce e marketplace lado a lado ao longo do período.",
  },
  bySource: {
    kind: "bySource",
    label: "Vendas por origem",
    description: "Receita paga por origem e meio de tráfego; marketplaces pelo nome do canal.",
  },
  topProducts: {
    kind: "topProducts",
    label: "Produtos mais vendidos",
    description: "Os dez produtos que mais faturaram no período.",
  },
  customerMix: {
    kind: "customerMix",
    label: "Clientes novos × recorrentes",
    description: "Quem comprou pela primeira vez e quem voltou.",
  },
  funnel: {
    kind: "funnel",
    label: "Funil do e-commerce",
    description: "Sessões, produto visto, carrinho, checkout e pedidos pagos.",
  },
  paidMedia: {
    kind: "paidMedia",
    label: "Mídia paga",
    description: "Investimento em anúncios e a receita atribuída, por período.",
  },
  matrix: {
    kind: "matrix",
    label: "Resumo financeiro",
    description: "Cada métrica do período aberta por bucket, com exportação em CSV.",
  },
  alerts: {
    kind: "alerts",
    label: "Precisa da sua atenção",
    description: "Alertas derivados dos dados dos últimos dias.",
  },
  milestone: {
    kind: "milestone",
    label: "Marco de maturidade",
    description: "Os quatro critérios que liberam as áreas bloqueadas.",
  },
  recommendations: {
    kind: "recommendations",
    label: "Recomendações em aberto",
    description: "O que o consultor recomendou e ainda não foi concluído.",
  },
};

export type DashboardWidget = { kind: DashboardWidgetKind };

export type DashboardLayout = { widgets: DashboardWidget[] };

export const defaultDashboardLayout: DashboardLayout = {
  widgets: [
    { kind: "headline" },
    { kind: "indicator" },
    { kind: "revenueVsInvestment" },
    { kind: "channelSplit" },
    { kind: "bySource" },
    { kind: "topProducts" },
    { kind: "customerMix" },
    { kind: "funnel" },
    { kind: "alerts" },
    { kind: "milestone" },
    { kind: "recommendations" },
  ],
};
