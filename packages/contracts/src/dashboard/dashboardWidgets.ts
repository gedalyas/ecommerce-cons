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

export const dashboardWidgetSizes = ["full", "half"] as const;
export type DashboardWidgetSize = (typeof dashboardWidgetSizes)[number];

export const dashboardWidgetSizeLabel: Record<DashboardWidgetSize, string> = {
  full: "Linha inteira",
  half: "Meia linha",
};

export type DashboardWidgetDefinition = {
  kind: DashboardWidgetKind;
  label: string;
  description: string;
  defaultSize: DashboardWidgetSize;
};

export const dashboardWidgetCatalog: Record<DashboardWidgetKind, DashboardWidgetDefinition> = {
  headline: {
    kind: "headline",
    label: "Indicadores em destaque",
    description: "Faturamento, margem, CAC e recompra com a variação do período.",
    defaultSize: "full",
  },
  indicator: {
    kind: "indicator",
    label: "Evolução do indicador",
    description: "Escolha um indicador e veja a curva do período contra a comparação.",
    defaultSize: "full",
  },
  revenueVsInvestment: {
    kind: "revenueVsInvestment",
    label: "Receita × investimento",
    description: "Quanto entrou de receita para cada real investido em marketing, por período.",
    defaultSize: "half",
  },
  channelSplit: {
    kind: "channelSplit",
    label: "Vendas por canal",
    description: "E-commerce e marketplace lado a lado ao longo do período.",
    defaultSize: "half",
  },
  bySource: {
    kind: "bySource",
    label: "Vendas por origem",
    description: "Receita paga por origem e meio de tráfego; marketplaces pelo nome do canal.",
    defaultSize: "half",
  },
  topProducts: {
    kind: "topProducts",
    label: "Produtos mais vendidos",
    description: "Os dez produtos que mais faturaram no período.",
    defaultSize: "half",
  },
  customerMix: {
    kind: "customerMix",
    label: "Clientes novos × recorrentes",
    description: "Quem comprou pela primeira vez e quem voltou.",
    defaultSize: "half",
  },
  funnel: {
    kind: "funnel",
    label: "Funil do e-commerce",
    description: "Sessões, produto visto, carrinho, checkout e pedidos pagos.",
    defaultSize: "half",
  },
  paidMedia: {
    kind: "paidMedia",
    label: "Mídia paga",
    description: "Investimento em anúncios e a receita atribuída, por período.",
    defaultSize: "half",
  },
  matrix: {
    kind: "matrix",
    label: "Resumo financeiro",
    description: "Cada métrica do período aberta por bucket, com exportação em CSV.",
    defaultSize: "full",
  },
  alerts: {
    kind: "alerts",
    label: "Precisa da sua atenção",
    description: "Alertas derivados dos dados dos últimos dias.",
    defaultSize: "full",
  },
  milestone: {
    kind: "milestone",
    label: "Marco de maturidade",
    description: "Os quatro critérios que liberam as áreas bloqueadas.",
    defaultSize: "full",
  },
  recommendations: {
    kind: "recommendations",
    label: "Recomendações em aberto",
    description: "O que o consultor recomendou e ainda não foi concluído.",
    defaultSize: "full",
  },
};

export type DashboardWidget = { kind: DashboardWidgetKind; size: DashboardWidgetSize };

export type DashboardLayout = { widgets: DashboardWidget[] };

export const defaultDashboardLayout: DashboardLayout = {
  widgets: [
    { kind: "headline", size: "full" },
    { kind: "indicator", size: "full" },
    { kind: "revenueVsInvestment", size: "half" },
    { kind: "channelSplit", size: "half" },
    { kind: "bySource", size: "half" },
    { kind: "topProducts", size: "half" },
    { kind: "customerMix", size: "half" },
    { kind: "funnel", size: "half" },
    { kind: "alerts", size: "full" },
    { kind: "milestone", size: "full" },
    { kind: "recommendations", size: "full" },
  ],
};
