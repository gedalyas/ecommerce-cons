const glossaryTerms = [
  "totalSold",
  "orders",
  "averageTicket",
  "conversionRate",
  "marketingInvestment",
  "adSpend",
  "roas",
  "roi",
  "cac",
  "cpa",
  "netProfit",
  "customers",
  "contributionMargin",
  "repurchaseRate",
  "cartAbandonment",
  "revenuePerSession",
  "costPerSession",
] as const;

type GlossaryTerm = (typeof glossaryTerms)[number];

type MetricExplanation = { definition: string; formula: string };

const metricGlossary: Record<GlossaryTerm, MetricExplanation> = {
  totalSold: {
    definition: "Tudo o que foi vendido no período, já sem os pedidos cancelados.",
    formula: "Soma do valor dos pedidos pagos",
  },
  orders: {
    definition: "Quantidade de pedidos pagos no período.",
    formula: "Contagem de pedidos pagos",
  },
  averageTicket: {
    definition: "Quanto cada pedido vale, em média.",
    formula: "Faturamento ÷ pedidos",
  },
  conversionRate: {
    definition: "De cada 100 visitas ao site, quantas viraram pedido.",
    formula: "Pedidos da loja própria ÷ sessões × 100",
  },
  marketingInvestment: {
    definition:
      "Tudo o que foi gasto para vender: anúncios, taxas das plataformas de anúncio e custos de marketing cadastrados.",
    formula: "Mídia + taxas + custos de marketing",
  },
  adSpend: {
    definition: "Valor investido em anúncios no período.",
    formula: "Soma do gasto nas plataformas de anúncio",
  },
  roas: {
    definition:
      "Quanto voltou em vendas para cada R$ 1 investido. 5x = R$ 5 vendidos para cada R$ 1 investido.",
    formula: "Faturamento ÷ investimento",
  },
  roi: {
    definition:
      "Quanto sobrou de retorno sobre o investimento, já descontado o próprio investimento.",
    formula: "(Faturamento − investimento) ÷ investimento",
  },
  cac: {
    definition:
      "Quanto do faturamento foi gasto em marketing para vender. 10% = R$ 10 de marketing a cada R$ 100 vendidos.",
    formula: "Investimento em marketing ÷ faturamento × 100",
  },
  cpa: {
    definition: "Quanto custou, em média, cada pedido.",
    formula: "Investimento ÷ pedidos",
  },
  netProfit: {
    definition: "O que sobra depois de produtos, taxas, marketing e custos operacionais.",
    formula: "Margem de contribuição − custos operacionais",
  },
  customers: {
    definition: "Pessoas diferentes que compraram no período.",
    formula: "Contagem de clientes com pedido pago",
  },
  contributionMargin: {
    definition:
      "Quanto de cada venda sobra depois do custo dos produtos, das taxas e do marketing.",
    formula: "(Faturamento − custos variáveis − investimento) ÷ faturamento × 100",
  },
  repurchaseRate: {
    definition: "De cada 100 pedidos, quantos vieram de quem já tinha comprado antes.",
    formula: "Pedidos de clientes recorrentes ÷ pedidos × 100",
  },
  cartAbandonment: {
    definition: "De cada 100 carrinhos criados, quantos não viraram pedido.",
    formula: "(Carrinhos − pedidos) ÷ carrinhos × 100",
  },
  revenuePerSession: {
    definition: "Quanto cada visita ao site rendeu em vendas, em média.",
    formula: "Faturamento ÷ sessões",
  },
  costPerSession: {
    definition: "Quanto custou, em média, trazer cada visita ao site.",
    formula: "Investimento ÷ sessões",
  },
};

const isGlossaryTerm = (key: string): key is GlossaryTerm =>
  (glossaryTerms as readonly string[]).includes(key);

export const explanationOf = (key: string): MetricExplanation | null =>
  isGlossaryTerm(key) ? metricGlossary[key] : null;
