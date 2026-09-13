export const connectorKeys = [
  "bling",
  "shopify",
  "nuvemshop",
  "vtex",
  "meta_ads",
  "google_ads",
  "tiktok_ads",
  "ga4",
  "manual_csv",
] as const;
export type ConnectorKey = (typeof connectorKeys)[number];

export const connectorKinds = ["erp", "storefront", "paid_media", "analytics", "manual"] as const;
export type ConnectorKind = (typeof connectorKinds)[number];

export const connectorKindLabel: Record<ConnectorKind, string> = {
  erp: "ERP",
  storefront: "Plataforma",
  paid_media: "Mídia paga",
  analytics: "Analytics",
  manual: "Importação manual",
};

export const connectorAvailabilities = ["manual", "request", "oauth"] as const;
export type ConnectorAvailability = (typeof connectorAvailabilities)[number];

export const connectorFeeds = ["orders", "ad_spend", "traffic"] as const;
export type ConnectorFeed = (typeof connectorFeeds)[number];

export const connectorFeedLabel: Record<ConnectorFeed, string> = {
  orders: "Pedidos",
  ad_spend: "Mídia paga",
  traffic: "Tráfego",
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
};

export const connectorCatalog: Connector[] = [
  {
    key: "manual_csv",
    label: "Importação manual (CSV)",
    kind: "manual",
    feeds: ["orders", "ad_spend", "traffic"],
    availability: "manual",
    authPattern: null,
    description: "Planilhas exportadas da sua plataforma ou das contas de mídia.",
  },
  {
    key: "bling",
    label: "Bling",
    kind: "erp",
    feeds: ["orders"],
    availability: "request",
    authPattern: "oauth",
    description: "Pedidos, produtos e estoque do ERP.",
  },
  {
    key: "shopify",
    label: "Shopify",
    kind: "storefront",
    feeds: ["orders"],
    availability: "request",
    authPattern: "domain_oauth",
    description: "Pedidos e clientes da loja.",
  },
  {
    key: "nuvemshop",
    label: "Nuvemshop",
    kind: "storefront",
    feeds: ["orders"],
    availability: "request",
    authPattern: "domain_oauth",
    description: "Pedidos e clientes da loja.",
  },
  {
    key: "vtex",
    label: "VTEX",
    kind: "storefront",
    feeds: ["orders"],
    availability: "request",
    authPattern: "credentials",
    description: "Pedidos e clientes da loja.",
  },
  {
    key: "meta_ads",
    label: "Meta Ads",
    kind: "paid_media",
    feeds: ["ad_spend"],
    availability: "request",
    authPattern: "oauth",
    description: "Investimento, campanhas e resultados do Facebook e Instagram.",
  },
  {
    key: "google_ads",
    label: "Google Ads",
    kind: "paid_media",
    feeds: ["ad_spend"],
    availability: "request",
    authPattern: "oauth",
    description: "Investimento, campanhas e resultados do Google.",
  },
  {
    key: "tiktok_ads",
    label: "TikTok Ads",
    kind: "paid_media",
    feeds: ["ad_spend"],
    availability: "request",
    authPattern: "oauth",
    description: "Investimento, campanhas e resultados do TikTok.",
  },
  {
    key: "ga4",
    label: "Google Analytics 4",
    kind: "analytics",
    feeds: ["traffic"],
    availability: "request",
    authPattern: "oauth",
    description: "Sessões, usuários e eventos do funil do site.",
  },
];

export function connectorOf(key: ConnectorKey): Connector {
  return connectorCatalog.find((c) => c.key === key)!;
}

export const storefrontConnectorKeys = connectorCatalog
  .filter((c) => c.kind === "storefront" || c.kind === "erp")
  .map((c) => c.key);
