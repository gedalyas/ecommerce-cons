import { foldForSearch } from "../shared/searchText";
import {
  connectorGroups,
  connectorKindLabel,
  type ConnectorKey,
  type ConnectorKind,
} from "./connectorCatalog";

export const connectorCategories = ["gestao", "vendas", "marketing"] as const;
export type ConnectorCategory = (typeof connectorCategories)[number];

export const connectorCategoryLabel: Record<ConnectorCategory, string> = {
  gestao: "Gestão (ERP)",
  vendas: "Vendas online",
  marketing: "Marketing",
};

export const connectorCategoryHint: Record<ConnectorCategory, string> = {
  gestao: "Comece pelo ERP: é de onde vêm as vendas de todos os canais (site e marketplaces).",
  vendas: "Loja virtual, marketplaces e lojas nas redes sociais: produtos, estoque e clientes.",
  marketing: "Investimento em anúncios, redes sociais e tráfego do site. Nunca trazem vendas.",
};

const categoryOfKind: Record<ConnectorKind, ConnectorCategory | null> = {
  erp: "gestao",
  storefront: "vendas",
  marketplace: "vendas",
  social_commerce: "vendas",
  paid_media: "marketing",
  social: "marketing",
  analytics: "marketing",
  manual: null,
};

export const recommendedConnectors: Record<ConnectorCategory, readonly ConnectorKey[]> = {
  gestao: ["bling"],
  vendas: ["mercado_livre", "shopify", "nuvemshop"],
  marketing: ["meta_ads", "google_ads", "ga4"],
};

export const isRecommendedConnector = (key: ConnectorKey): boolean =>
  connectorCategories.some((category) => recommendedConnectors[category].includes(key));

type Catalogued = { key: ConnectorKey; kind: ConnectorKind; label: string; description: string };

export type CategoryGroup<T> = {
  category: ConnectorCategory;
  sections: { kind: ConnectorKind; items: T[] }[];
};

export function connectorsOfCategory<T extends Catalogued>(
  connectors: readonly T[],
  category: ConnectorCategory,
): CategoryGroup<T> {
  return {
    category,
    sections: connectorGroups(connectors.filter((c) => categoryOfKind[c.kind] === category)),
  };
}

function matchesConnectorSearch(connector: Catalogued, query: string): boolean {
  const needle = foldForSearch(query);
  if (!needle) return true;
  return [connector.label, connector.description, connectorKindLabel[connector.kind]].some((text) =>
    foldForSearch(text).includes(needle),
  );
}

export function searchConnectors<T extends Catalogued>(
  connectors: readonly T[],
  query: string,
): CategoryGroup<T>[] {
  const found = connectors.filter((c) => matchesConnectorSearch(c, query));
  return connectorCategories
    .map((category) => connectorsOfCategory(found, category))
    .filter((group) => group.sections.length > 0);
}
