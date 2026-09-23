const dataKinds = [
  "sales",
  "products",
  "stock",
  "customers",
  "ad_spend",
  "traffic",
  "social",
] as const;
export type DataKind = (typeof dataKinds)[number];

export const dataKindLabel: Record<DataKind, string> = {
  sales: "Vendas",
  products: "Produtos",
  stock: "Estoque",
  customers: "Clientes",
  ad_spend: "Investimento em anúncios",
  traffic: "Tráfego do site",
  social: "Redes sociais",
};
