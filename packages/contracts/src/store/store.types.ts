import type { ConnectorKey } from "../connectors/connectorCatalog";

export const storeSegments = [
  "fashion",
  "beauty",
  "home",
  "electronics",
  "food",
  "health",
  "pets",
  "kids",
  "sports",
  "other",
] as const;
export type StoreSegment = (typeof storeSegments)[number];

export const storeSegmentLabel: Record<StoreSegment, string> = {
  fashion: "Moda e acessórios",
  beauty: "Beleza e cosméticos",
  home: "Casa e decoração",
  electronics: "Eletrônicos",
  food: "Alimentos e bebidas",
  health: "Saúde e suplementos",
  pets: "Pet",
  kids: "Infantil",
  sports: "Esporte",
  other: "Outro",
};

export const revenueBands = ["until_50k", "50k_200k", "200k_500k", "500k_2m", "above_2m"] as const;
export type RevenueBand = (typeof revenueBands)[number];

export const revenueBandLabel: Record<RevenueBand, string> = {
  until_50k: "Até R$ 50 mil / mês",
  "50k_200k": "R$ 50 a 200 mil / mês",
  "200k_500k": "R$ 200 a 500 mil / mês",
  "500k_2m": "R$ 500 mil a 2 milhões / mês",
  above_2m: "Acima de R$ 2 milhões / mês",
};

export type StoreProfile = {
  name: string;
  segment: StoreSegment | null;
  platform: ConnectorKey | null;
  monthlyRevenueBand: RevenueBand | null;
  timezone: string;
};

export type Store = StoreProfile & {
  id: string;
  slug: string;
  createdAt: string;
  onboardedAt: string | null;
};
