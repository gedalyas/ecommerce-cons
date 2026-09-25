const glossaryTerms = [
  "totalSold",
  "orders",
  "averageTicket",
  "conversionRate",
  "marketingInvestment",
  "adSpend",
  "roas",
  "siteRoas",
  "platformRevenue",
  "platformRoas",
  "mer",
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
  "sessions",
  "spend",
  "impressions",
  "reach",
  "cpm",
  "clicks",
  "linkClicks",
  "ctr",
  "cpc",
  "landingPageViews",
  "addToCart",
  "conversions",
  "costPerConversion",
  "leads",
  "messages",
  "costPerLead",
  "impressionShare",
  "engagedSessions",
  "users",
  "newUsers",
  "pageViews",
  "averageDuration",
  "engagementRate",
  "bounceRate",
  "gaPurchases",
  "couponOrders",
  "couponShare",
  "discounts",
  "couponRevenue",
  "discountRate",
  "aovWithCoupon",
  "aovWithoutCoupon",
  "followers",
  "socialReach",
  "socialEngagement",
  "socialEngagementRate",
  "posts",
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
      "Quanto a loja vendeu, em todos os canais, para cada R$ 1 investido em anúncios. 5x = R$ 5 vendidos para cada R$ 1 investido.",
    formula: "Vendas totais ÷ investimento em anúncios",
  },
  siteRoas: {
    definition:
      "Quanto o site vendeu para cada R$ 1 investido nos anúncios que levam ao site. 5x = R$ 5 vendidos para cada R$ 1 investido.",
    formula: "Vendas do site ÷ investimento em anúncios do site",
  },
  platformRevenue: {
    definition:
      "Vendas que a própria plataforma atribui aos anúncios, pelo valor de conversão que ela informa.",
    formula: "Soma do valor das conversões informadas pela plataforma",
  },
  platformRoas: {
    definition:
      "Quanto a plataforma diz ter vendido para cada R$ 1 investido nela. Serve para comparar campanhas e plataformas.",
    formula: "Vendas informadas pela plataforma ÷ investimento na plataforma",
  },
  mer: {
    definition:
      "Retorno geral: todas as vendas da loja, de todos os canais, sobre todo o investimento em marketing. Inclui vendas que não vieram de anúncio.",
    formula: "Faturamento total ÷ investimento total em marketing",
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
  sessions: {
    definition: "Visitas ao site no período, segundo o Google Analytics.",
    formula: "Soma das sessões",
  },
  costPerSession: {
    definition: "Quanto custou, em média, trazer cada visita ao site.",
    formula: "Investimento ÷ sessões",
  },
  spend: {
    definition: "Quanto foi gasto em anúncios nesta plataforma no período.",
    formula: "Soma do investimento da plataforma",
  },
  impressions: {
    definition: "Quantas vezes os anúncios apareceram na tela.",
    formula: "Soma das impressões",
  },
  reach: {
    definition:
      "Pessoas que viram os anúncios, somadas dia a dia: quem viu em dois dias conta duas vezes.",
    formula: "Soma do alcance diário",
  },
  cpm: {
    definition: "Quanto custou mostrar os anúncios mil vezes.",
    formula: "Investimento ÷ impressões × 1.000",
  },
  clicks: {
    definition: "Todos os cliques no anúncio, inclusive curtidas e perfil.",
    formula: "Soma dos cliques",
  },
  linkClicks: {
    definition: "Cliques que levaram para fora do anúncio, rumo ao site ou à loja.",
    formula: "Soma dos cliques no link",
  },
  ctr: {
    definition: "De cada 100 impressões, quantas viraram clique.",
    formula: "Cliques ÷ impressões × 100",
  },
  cpc: {
    definition: "Quanto custou, em média, cada clique.",
    formula: "Investimento ÷ cliques",
  },
  landingPageViews: {
    definition: "Cliques em que a página de destino chegou a carregar.",
    formula: "Soma das visualizações da página de destino",
  },
  addToCart: {
    definition: "Adições ao carrinho que a plataforma atribui aos anúncios.",
    formula: "Soma das adições ao carrinho informadas",
  },
  conversions: {
    definition:
      "Compras que a própria plataforma atribui aos anúncios. Servem para comparar campanhas; a venda da loja vem do ERP ou da planilha.",
    formula: "Soma das conversões informadas pela plataforma",
  },
  costPerConversion: {
    definition: "Quanto custou, em média, cada conversão informada pela plataforma.",
    formula: "Investimento ÷ conversões informadas",
  },
  leads: {
    definition: "Cadastros gerados por formulários dos anúncios.",
    formula: "Soma dos leads",
  },
  messages: {
    definition: "Conversas iniciadas pelo anúncio no WhatsApp, Messenger ou Direct.",
    formula: "Soma das conversas iniciadas",
  },
  costPerLead: {
    definition: "Quanto custou, em média, cada cadastro.",
    formula: "Investimento ÷ leads",
  },
  impressionShare: {
    definition: "Das vezes em que o anúncio poderia aparecer nas buscas, em quantas apareceu.",
    formula: "Impressões ÷ impressões possíveis × 100",
  },
  engagedSessions: {
    definition:
      "Visitas que duraram mais de 10 segundos, viram duas páginas ou mais ou tiveram uma conversão, segundo o Google Analytics.",
    formula: "Soma das sessões engajadas",
  },
  users: {
    definition: "Pessoas diferentes que visitaram o site no período.",
    formula: "Usuários ativos do Google Analytics",
  },
  newUsers: {
    definition: "Pessoas que visitaram o site pela primeira vez no período.",
    formula: "Soma dos novos usuários",
  },
  pageViews: {
    definition: "Quantas páginas do site foram abertas, contando repetições.",
    formula: "Soma das visualizações de página",
  },
  averageDuration: {
    definition: "Quanto tempo, em média, cada visita ficou no site.",
    formula: "Duração total das sessões ÷ sessões",
  },
  engagementRate: {
    definition: "De cada 100 visitas, quantas foram engajadas.",
    formula: "Sessões engajadas ÷ sessões × 100",
  },
  bounceRate: {
    definition: "De cada 100 visitas, quantas saíram sem engajar.",
    formula: "100 − taxa de engajamento",
  },
  gaPurchases: {
    definition:
      "Compras que o Google Analytics contou no site. Servem para comparar públicos e regiões; a venda da loja vem do ERP ou da planilha.",
    formula: "Soma dos eventos de compra",
  },
  couponOrders: {
    definition: "Pedidos pagos em que o cliente usou um cupom.",
    formula: "Contagem de pedidos pagos com cupom",
  },
  couponShare: {
    definition: "De cada 100 pedidos, quantos usaram cupom.",
    formula: "Pedidos com cupom ÷ pedidos × 100",
  },
  discounts: {
    definition: "Quanto a loja deixou de receber com os cupons.",
    formula: "Soma dos descontos dos pedidos com cupom",
  },
  couponRevenue: {
    definition: "O que os pedidos com cupom faturaram, já com o desconto.",
    formula: "Soma do valor pago dos pedidos com cupom",
  },
  discountRate: {
    definition: "Quanto do preço cheio o cupom abateu, em média.",
    formula: "Desconto ÷ (receita com cupom + desconto) × 100",
  },
  aovWithCoupon: {
    definition: "Valor médio dos pedidos que usaram cupom.",
    formula: "Receita com cupom ÷ pedidos com cupom",
  },
  aovWithoutCoupon: {
    definition: "Valor médio dos pedidos sem cupom, para comparar.",
    formula: "Receita sem cupom ÷ pedidos sem cupom",
  },
  followers: {
    definition: "Seguidores das contas no último dia sincronizado do período.",
    formula: "Seguidores no fim do período",
  },
  socialReach: {
    definition: "Pessoas alcançadas pelas publicações orgânicas, somadas dia a dia.",
    formula: "Soma do alcance diário do Instagram e do Facebook",
  },
  socialEngagement: {
    definition: "Curtidas, comentários, compartilhamentos e salvamentos nas publicações.",
    formula: "Soma das interações",
  },
  socialEngagementRate: {
    definition: "De cada 100 pessoas alcançadas, quantas interagiram.",
    formula: "Engajamento ÷ alcance × 100",
  },
  posts: {
    definition: "Publicações feitas no período.",
    formula: "Contagem de publicações",
  },
};

const isGlossaryTerm = (key: string): key is GlossaryTerm =>
  (glossaryTerms as readonly string[]).includes(key);

export const explanationOf = (key: string): MetricExplanation | null =>
  isGlossaryTerm(key) ? metricGlossary[key] : null;
