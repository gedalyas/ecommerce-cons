import type { DataKind } from "./dataKinds";

export const connectorKeys = [
  "bling",
  "tiny",
  "omie",
  "shopify",
  "nuvemshop",
  "mercado_livre",
  "amazon",
  "shopee",
  "magalu",
  "tiktok_shop",
  "vtex",
  "meta_ads",
  "instagram",
  "google_ads",
  "tiktok_ads",
  "mercado_ads",
  "amazon_ads",
  "shopee_ads",
  "ga4",
  "manual_csv",
] as const;
export type ConnectorKey = (typeof connectorKeys)[number];

export const connectorKinds = [
  "erp",
  "storefront",
  "marketplace",
  "social_commerce",
  "paid_media",
  "social",
  "analytics",
  "manual",
] as const;
export type ConnectorKind = (typeof connectorKinds)[number];

export const connectorKindLabel: Record<ConnectorKind, string> = {
  erp: "ERP",
  storefront: "Plataforma de e-commerce",
  marketplace: "Marketplace",
  social_commerce: "Social commerce",
  paid_media: "Anúncios",
  social: "Redes sociais",
  analytics: "Analytics",
  manual: "Planilha",
};

export const connectorKindGuide: Record<ConnectorKind, { order: number; hint: string }> = {
  erp: {
    order: 1,
    hint: "Comece pelo ERP: é de onde vêm as vendas de todos os canais (site e marketplaces).",
  },
  storefront: {
    order: 2,
    hint: "Produtos, estoque e clientes da loja virtual, quando o ERP não traz. Vendas vêm do ERP ou da planilha.",
  },
  marketplace: {
    order: 3,
    hint: "Produtos e estoque do marketplace, quando o ERP não traz. Vendas vêm do ERP ou da planilha.",
  },
  social_commerce: {
    order: 4,
    hint: "Produtos e estoque das lojas dentro das redes sociais. Vendas vêm do ERP ou da planilha.",
  },
  paid_media: {
    order: 5,
    hint: "Investimento em anúncios: do site (Meta, Google, TikTok) e dos marketplaces (Mercado Ads, Amazon Ads, Shopee Ads). Nunca vendas.",
  },
  social: { order: 6, hint: "Seguidores, alcance e engajamento das suas redes." },
  analytics: { order: 7, hint: "Sessões e funil do site para calcular conversão." },
  manual: {
    order: 8,
    hint: "Sem ERP? Envie a planilha de vendas; ela também serve para mídia e tráfego.",
  },
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

export const authPatterns = ["oauth", "domain_oauth", "credentials"] as const;
export type AuthPattern = (typeof authPatterns)[number];

export type Connector = {
  key: ConnectorKey;
  label: string;
  kind: ConnectorKind;
  provides: DataKind[];
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
    label: "Planilha",
    kind: "manual",
    provides: ["sales", "ad_spend", "traffic"],
    availability: "manual",
    authPattern: null,
    description: "Quando não há ERP ou conexão.",
    requirements: [],
    domainHint: null,
  },
  {
    key: "bling",
    label: "Bling",
    kind: "erp",
    provides: ["sales", "products", "stock", "customers"],
    availability: "request",
    authPattern: "oauth",
    description: "ERP que concentra as vendas do site e dos marketplaces.",
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
    provides: ["products", "stock", "customers"],
    availability: "request",
    authPattern: "domain_oauth",
    description: "Loja virtual.",
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
    provides: ["products", "stock", "customers"],
    availability: "request",
    authPattern: "domain_oauth",
    description: "Loja virtual.",
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
    provides: ["products", "stock"],
    availability: "request",
    authPattern: "oauth",
    description: "Marketplace, incluindo o Full.",
    requirements: [
      "Entrar com a conta vendedora do Mercado Livre (a mesma que administra as vendas).",
    ],
    domainHint: null,
  },
  {
    key: "amazon",
    label: "Amazon",
    kind: "marketplace",
    provides: ["products", "stock"],
    availability: "request",
    authPattern: "oauth",
    description: "Marketplace (Selling Partner API).",
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
    provides: ["products", "stock", "customers"],
    availability: "request",
    authPattern: "credentials",
    description: "Loja virtual.",
    requirements: [],
    domainHint: null,
  },
  {
    key: "meta_ads",
    label: "Meta Ads",
    kind: "paid_media",
    provides: ["ad_spend"],
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
    provides: ["social"],
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
    provides: ["ad_spend"],
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
    provides: ["ad_spend"],
    availability: "request",
    authPattern: "oauth",
    description: "Investimento, campanhas e resultados do TikTok.",
    requirements: ["Ter acesso à conta de anúncios no TikTok for Business."],
    domainHint: null,
  },
  {
    key: "tiny",
    label: "Tiny (Olist)",
    kind: "erp",
    provides: ["sales", "products", "stock", "customers"],
    availability: "request",
    authPattern: "credentials",
    description: "ERP que concentra as vendas do site e dos marketplaces.",
    requirements: ["Ter acesso de administrador à conta do Tiny para gerar o token da API."],
    domainHint: null,
  },
  {
    key: "omie",
    label: "Omie",
    kind: "erp",
    provides: ["sales", "products", "stock", "customers"],
    availability: "request",
    authPattern: "credentials",
    description: "ERP que concentra as vendas do site e dos marketplaces.",
    requirements: ["Ter acesso ao Omie Developer para gerar a App Key e o App Secret."],
    domainHint: null,
  },
  {
    key: "shopee",
    label: "Shopee",
    kind: "marketplace",
    provides: ["products", "stock"],
    availability: "request",
    authPattern: "oauth",
    description: "Marketplace, incluindo o Fulfillment.",
    requirements: ["Entrar com a conta principal da loja na Shopee."],
    domainHint: null,
  },
  {
    key: "magalu",
    label: "Magalu",
    kind: "marketplace",
    provides: ["products", "stock"],
    availability: "request",
    authPattern: "oauth",
    description: "Marketplace, incluindo o Magalu Entregas.",
    requirements: ["Ser o administrador da conta de vendedor no Magalu."],
    domainHint: null,
  },
  {
    key: "tiktok_shop",
    label: "TikTok Shop",
    kind: "social_commerce",
    provides: ["products", "stock"],
    availability: "request",
    authPattern: "oauth",
    description: "Loja dentro do TikTok.",
    requirements: ["Ter a conta de vendedor do TikTok Shop aprovada."],
    domainHint: null,
  },
  {
    key: "mercado_ads",
    label: "Mercado Ads",
    kind: "paid_media",
    provides: ["ad_spend"],
    availability: "request",
    authPattern: "oauth",
    description: "Investimento em anúncios dentro do Mercado Livre.",
    requirements: ["Entrar com a conta vendedora do Mercado Livre que tem o Mercado Ads ativo."],
    domainHint: null,
  },
  {
    key: "amazon_ads",
    label: "Amazon Ads",
    kind: "paid_media",
    provides: ["ad_spend"],
    availability: "request",
    authPattern: "oauth",
    description: "Investimento em anúncios dentro da Amazon.",
    requirements: ["Ter acesso ao console do Amazon Ads da conta de vendedor."],
    domainHint: null,
  },
  {
    key: "shopee_ads",
    label: "Shopee Ads",
    kind: "paid_media",
    provides: ["ad_spend"],
    availability: "request",
    authPattern: "oauth",
    description: "Investimento em anúncios dentro da Shopee.",
    requirements: ["Entrar com a conta principal da loja na Shopee."],
    domainHint: null,
  },
  {
    key: "ga4",
    label: "Google Analytics 4",
    kind: "analytics",
    provides: ["traffic"],
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

export const providesKind = (key: ConnectorKey, kind: DataKind): boolean =>
  connectorOf(key).provides.includes(kind);

export const storefrontConnectorKeys = connectorCatalog
  .filter((c) => c.kind === "storefront" || c.kind === "erp")
  .map((c) => c.key);
