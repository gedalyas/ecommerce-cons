import type { BusinessUnit, CostCategory, CostFrequency } from "./costSets";

/** Categories, subcategories and frequencies of the cost registry (Portuguese labels, English keys). */
export const costCategoryLabel: Record<CostCategory, string> = {
  COGS: "Custo de mercadorias vendidas",
  SALES_MARKETING: "Vendas e marketing",
  OPERATIONAL: "Operacional",
};

export const costSubcategories: Record<CostCategory, { key: string; label: string }[]> = {
  COGS: [
    { key: "antifraud", label: "Anti-fraude" },
    { key: "checkout", label: "Checkout" },
    { key: "shipping", label: "Frete" },
    { key: "gateway", label: "Gateway" },
    { key: "taxes", label: "Impostos" },
    { key: "raw_material", label: "Matéria-prima" },
    { key: "platform", label: "Plataforma" },
    { key: "product", label: "Produto" },
    { key: "marketplace_fee", label: "Taxa de marketplace" },
  ],
  SALES_MARKETING: [
    { key: "agency", label: "Agência" },
    { key: "commission", label: "Comissão" },
    { key: "email_marketing", label: "E-mail marketing" },
    { key: "meta_ads", label: "Meta Ads" },
    { key: "google_ads", label: "Google Ads" },
    { key: "tiktok_ads", label: "TikTok Ads" },
    { key: "meta_ads_tax", label: "Imposto Meta Ads" },
    { key: "google_ads_tax", label: "Imposto Google Ads" },
    { key: "tiktok_ads_tax", label: "Imposto TikTok Ads" },
    { key: "retail_media", label: "Retail media" },
    { key: "marketplace_fee", label: "Taxa de marketplace" },
  ],
  OPERATIONAL: [
    { key: "rent", label: "Aluguel" },
    { key: "apps", label: "Aplicativos" },
    { key: "tools", label: "Ferramentas" },
    { key: "other", label: "Outros" },
    { key: "pos", label: "PDV" },
    { key: "salary", label: "Salário" },
    { key: "software", label: "Software" },
  ],
};

export const costFrequencyLabel: Record<CostFrequency, string> = {
  DAILY: "Diário",
  WEEKLY: "Semanal",
  MONTHLY: "Mensal",
  YEARLY: "Anual",
  ONE_TIME: "Não recorrente",
  PER_ORDER: "Por pedido",
  PERCENT_PER_ORDER: "Percentual por pedido",
  PERCENT_OF_AD_SPEND: "Percentual do gasto em ads",
};

export const businessUnitLabel: Record<BusinessUnit, string> = {
  ECOMMERCE: "E-commerce",
  MARKETPLACE: "Marketplace",
  BOTH: "Ambos",
};

/** Frequencies whose value is a percentage, not an amount in BRL. */
export const percentFrequencies: readonly CostFrequency[] = [
  "PERCENT_PER_ORDER",
  "PERCENT_OF_AD_SPEND",
];

export const subcategoryLabel = (category: CostCategory, key: string) =>
  costSubcategories[category].find((s) => s.key === key)?.label ?? key;

export const isSubcategoryOf = (category: CostCategory, key: string) =>
  costSubcategories[category].some((s) => s.key === key);
