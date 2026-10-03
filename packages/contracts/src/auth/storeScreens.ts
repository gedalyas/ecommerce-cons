export const storeScreens = [
  "ASSISTANT",
  "MONEY",
  "MARKETING",
  "LOGISTICS",
  "MANAGEMENT",
  "ORDERS",
  "PRODUCTS",
  "CUSTOMERS",
  "GOALS",
  "METRICS",
  "INFLUENCERS",
] as const;
export type StoreScreen = (typeof storeScreens)[number];

export const storeScreenLabel: Record<StoreScreen, string> = {
  ASSISTANT: "Assistente",
  MONEY: "Dinheiro",
  MARKETING: "Marketing",
  LOGISTICS: "Logística",
  MANAGEMENT: "Gestão",
  ORDERS: "Pedidos",
  PRODUCTS: "Produtos",
  CUSTOMERS: "Clientes",
  GOALS: "Metas",
  METRICS: "Métricas",
  INFLUENCERS: "Influenciadores",
};

export const defaultReleasedScreens: readonly StoreScreen[] = storeScreens;

export const UNDER_DEVELOPMENT_LABEL = "Em desenvolvimento";
export const UNDER_DEVELOPMENT_MESSAGE =
  "Esta tela está em desenvolvimento e ainda não foi liberada para a sua loja.";
