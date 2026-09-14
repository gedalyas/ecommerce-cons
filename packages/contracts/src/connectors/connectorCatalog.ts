export const connectorKeys = [
  "bling",
  "shopify",
  "nuvemshop",
  "mercado_livre",
  "amazon",
  "vtex",
  "meta_ads",
  "instagram",
  "google_ads",
  "tiktok_ads",
  "ga4",
  "manual_csv",
] as const;
export type ConnectorKey = (typeof connectorKeys)[number];

export const connectorKinds = [
  "erp",
  "storefront",
  "marketplace",
  "paid_media",
  "social",
  "analytics",
  "manual",
] as const;
export type ConnectorKind = (typeof connectorKinds)[number];

export const connectorKindLabel: Record<ConnectorKind, string> = {
  erp: "ERP",
  storefront: "Plataforma",
  marketplace: "Marketplace",
  paid_media: "Mídia paga",
  social: "Redes sociais",
  analytics: "Analytics",
  manual: "Importação manual",
};

export const connectorKindGuide: Record<ConnectorKind, { order: number; hint: string }> = {
  storefront: { order: 1, hint: "Comece pela sua loja: é de onde vêm os pedidos e os clientes." },
  marketplace: { order: 2, hint: "Vendas fora do site entram por aqui." },
  erp: { order: 3, hint: "Se você emite pedidos pelo ERP, conecte-o para completar as vendas." },
  paid_media: {
    order: 4,
    hint: "Cada conta de anúncios conectada aparece nas campanhas e no ROAS.",
  },
  social: { order: 5, hint: "Seguidores, alcance e engajamento das suas redes." },
  analytics: { order: 6, hint: "Sessões e funil do site para calcular conversão." },
  manual: { order: 7, hint: "Quando uma fonte não tem conexão, importe a planilha exportada." },
};

export function connectorGroups<T extends { kind: ConnectorKind }>(
  connectors: readonly T[],
): { kind: ConnectorKind; items: T[] }[] {
  return connectorKinds
    .map((kind) => ({ kind, items: connectors.filter((c) => c.kind === kind) }))
    .filter((group) => group.items.length > 0)
    .sort((a, b) => connectorKindGuide[a.kind].order - connectorKindGuide[b.kind].order);
}

export const connectorAvailabilities = ["manual", "request", "oauth"] as const;
export type ConnectorAvailability = (typeof connectorAvailabilities)[number];

export const connectorFeeds = ["orders", "ad_spend", "traffic", "social"] as const;
export type ConnectorFeed = (typeof connectorFeeds)[number];

export const connectorFeedLabel: Record<ConnectorFeed, string> = {
  orders: "Pedidos",
  ad_spend: "Mídia paga",
  traffic: "Tráfego",
  social: "Redes sociais",
};

export const authPatterns = ["oauth", "domain_oauth", "credentials"] as const;
export type AuthPattern = (typeof authPatterns)[number];

export type Connector = {
  key: ConnectorKey;
  label: string;
  kind: ConnectorKind;
  feeds: ConnectorFeed[];
  availability: ConnectorAvailability;
  authPattern: AuthPattern | null;
  description: string;
  requirements: string[];
  domainHint: DomainHint | null;
};

export type DomainHint = { placeholder: string; help: string };

export const connectorCatalog: Connector[] = [
  {
    key: "manual_csv",
    label: "Importação manual (CSV)",
    kind: "manual",
    feeds: ["orders", "ad_spend", "traffic"],
    availability: "manual",
    authPattern: null,
    description: "Planilhas exportadas da sua plataforma ou das contas de mídia.",
    requirements: [],
    domainHint: null,
  },
  {
    key: "bling",
    label: "Bling",
    kind: "erp",
    feeds: ["orders"],
    availability: "request",
    authPattern: "oauth",
    description: "Pedidos, produtos e estoque do ERP.",
    requirements: [
      "Ser o usuário administrador da conta Bling (ou ter permissão para autorizar aplicativos).",
      "Ter pedidos de venda cadastrados no Bling — é de lá que vêm os dados.",
    ],
    domainHint: null,
  },
  {
    key: "shopify",
    label: "Shopify",
    kind: "storefront",
    feeds: ["orders"],
    availability: "request",
    authPattern: "domain_oauth",
    description: "Pedidos e clientes da loja.",
    requirements: [
      "Ser o proprietário da loja ou colaborador com permissão de instalar aplicativos.",
      "Ter o endereço interno da loja em mãos (termina em .myshopify.com).",
    ],
    domainHint: {
      placeholder: "minhaloja.myshopify.com",
      help: "No painel da Shopify: Configurações → Domínios. É o endereço que termina em .myshopify.com, não o domínio do site.",
    },
  },
  {
    key: "nuvemshop",
    label: "Nuvemshop",
    kind: "storefront",
    feeds: ["orders"],
    availability: "request",
    authPattern: "domain_oauth",
    description: "Pedidos e clientes da loja.",
    requirements: [
      "Ser o dono da conta Nuvemshop ou administrador com acesso a aplicativos.",
      "Ter o endereço da loja em mãos.",
    ],
    domainHint: {
      placeholder: "minhaloja.lojavirtualnuvem.com.br",
      help: "No painel da Nuvemshop: Configurações → Domínios. Vale o endereço .lojavirtualnuvem.com.br ou o domínio próprio da loja.",
    },
  },
  {
    key: "mercado_livre",
    label: "Mercado Livre",
    kind: "marketplace",
    feeds: ["orders"],
    availability: "request",
    authPattern: "oauth",
    description: "Vendas e compradores do marketplace.",
    requirements: [
      "Entrar com a conta vendedora do Mercado Livre (a mesma que administra as vendas).",
    ],
    domainHint: null,
  },
  {
    key: "amazon",
    label: "Amazon",
    kind: "marketplace",
    feeds: ["orders"],
    availability: "request",
    authPattern: "oauth",
    description: "Vendas do marketplace (Selling Partner API).",
    requirements: [
      "Ser administrador da conta no Seller Central (a autorização é concluída lá dentro).",
      "Vender no marketplace Brasil (Amazon.com.br).",
    ],
    domainHint: null,
  },
  {
    key: "vtex",
    label: "VTEX",
    kind: "storefront",
    feeds: ["orders"],
    availability: "request",
    authPattern: "credentials",
    description: "Pedidos e clientes da loja.",
    requirements: [],
    domainHint: null,
  },
  {
    key: "meta_ads",
    label: "Meta Ads",
    kind: "paid_media",
    feeds: ["ad_spend"],
    availability: "request",
    authPattern: "oauth",
    description: "Investimento, campanhas e resultados do Facebook e Instagram.",
    requirements: [
      "Ter acesso de administrador ou analista à conta de anúncios no Gerenciador de Negócios.",
      "Entrar com o seu perfil pessoal do Facebook — a Meta usa ele para confirmar o acesso.",
    ],
    domainHint: null,
  },
  {
    key: "instagram",
    label: "Instagram e Facebook",
    kind: "social",
    feeds: ["social"],
    availability: "request",
    authPattern: "oauth",
    description: "Seguidores, alcance e engajamento das publicações orgânicas.",
    requirements: [
      "A conta do Instagram precisa ser profissional (Comercial ou Criador de conteúdo).",
      "A conta precisa estar vinculada a uma Página do Facebook, e você precisa ser administrador da Página.",
      "Entrar com o seu perfil pessoal do Facebook.",
    ],
    domainHint: null,
  },
  {
    key: "google_ads",
    label: "Google Ads",
    kind: "paid_media",
    feeds: ["ad_spend"],
    availability: "request",
    authPattern: "oauth",
    description: "Investimento, campanhas e resultados do Google.",
    requirements: [
      "Entrar com a conta Google que tem acesso (leitura ou administração) à conta do Google Ads.",
      "Se houver mais de uma conta, você escolhe qual usar depois de autorizar.",
    ],
    domainHint: null,
  },
  {
    key: "tiktok_ads",
    label: "TikTok Ads",
    kind: "paid_media",
    feeds: ["ad_spend"],
    availability: "request",
    authPattern: "oauth",
    description: "Investimento, campanhas e resultados do TikTok.",
    requirements: ["Ter acesso à conta de anúncios no TikTok for Business."],
    domainHint: null,
  },
  {
    key: "ga4",
    label: "Google Analytics 4",
    kind: "analytics",
    feeds: ["traffic"],
    availability: "request",
    authPattern: "oauth",
    description: "Sessões, usuários e eventos do funil do site.",
    requirements: [
      "Entrar com a conta Google que é Leitor ou Editor da propriedade do GA4.",
      "Se houver mais de uma propriedade, você escolhe qual usar depois de autorizar.",
    ],
    domainHint: null,
  },
];

export function connectorOf(key: ConnectorKey): Connector {
  return connectorCatalog.find((c) => c.key === key)!;
}

export const storefrontConnectorKeys = connectorCatalog
  .filter((c) => c.kind === "storefront" || c.kind === "erp")
  .map((c) => c.key);
