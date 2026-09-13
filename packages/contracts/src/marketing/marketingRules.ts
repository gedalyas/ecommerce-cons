/**
 * Business rules that move with the market, not with each screen: ROAS
 * quality bands, funnel benchmarks and the LTV/CAC reference.
 */
export type RoasQuality = "alto" | "medio" | "baixo";

export const roasBands = { high: 5, low: 2 } as const;

export const platformFeeRate = 0.015;

export const roasQualityLabel: Record<RoasQuality, string> = {
  alto: "Alto (ROAS > 5)",
  medio: "Médio (ROAS 2 a 5)",
  baixo: "Baixo (ROAS < 2)",
};

export function roasQuality(roas: number | null): RoasQuality {
  if (roas == null || roas < roasBands.low) return "baixo";
  return roas > roasBands.high ? "alto" : "medio";
}

export const funnelSteps = [
  "sessions",
  "viewItem",
  "addToCart",
  "checkout",
  "orders",
  "paidOrders",
] as const;
export type FunnelStep = (typeof funnelSteps)[number];

export const funnelStepLabel: Record<FunnelStep, string> = {
  sessions: "Sessões",
  viewItem: "Visualizar item",
  addToCart: "Adicionado ao carrinho",
  checkout: "Checkouts",
  orders: "Pedidos",
  paidOrders: "Pedidos pagos",
};

export type FunnelRatio = {
  key: string;
  label: string;
  from: FunnelStep;
  to: FunnelStep;
  /** Market benchmark range in percent. */
  benchmark: { min: number; max: number };
};

/** The eight conversion ratios the funnel table shows, with market benchmarks. */
export const funnelRatios: readonly FunnelRatio[] = [
  {
    key: "sessionsToView",
    label: "Sessões → Visualizar item",
    from: "sessions",
    to: "viewItem",
    benchmark: { min: 15, max: 40 },
  },
  {
    key: "viewToCart",
    label: "Visualizar item → Carrinho",
    from: "viewItem",
    to: "addToCart",
    benchmark: { min: 35, max: 55 },
  },
  {
    key: "sessionsToCart",
    label: "Sessões → Carrinho",
    from: "sessions",
    to: "addToCart",
    benchmark: { min: 6, max: 17.1 },
  },
  {
    key: "sessionsToCheckout",
    label: "Sessões → Checkout",
    from: "sessions",
    to: "checkout",
    benchmark: { min: 1.6, max: 3.5 },
  },
  {
    key: "sessionsToPaid",
    label: "Sessões → Pedidos pagos",
    from: "sessions",
    to: "paidOrders",
    benchmark: { min: 0.5, max: 1.4 },
  },
  {
    key: "cartToCheckout",
    label: "Carrinho → Checkouts",
    from: "addToCart",
    to: "checkout",
    benchmark: { min: 16.1, max: 35.4 },
  },
  {
    key: "checkoutToOrders",
    label: "Checkouts → Pedidos captados",
    from: "checkout",
    to: "orders",
    benchmark: { min: 32.2, max: 62.8 },
  },
  {
    key: "ordersToPaid",
    label: "Pedidos captados → Pedidos pagos",
    from: "orders",
    to: "paidOrders",
    benchmark: { min: 81.1, max: 91.8 },
  },
];

export type FunnelCounts = Record<FunnelStep, number>;

export const funnelRatio = (counts: FunnelCounts, ratio: FunnelRatio) =>
  counts[ratio.from] > 0 ? (counts[ratio.to] / counts[ratio.from]) * 100 : null;

export type BenchmarkVerdict = "abaixo" | "dentro" | "acima";

export function benchmarkVerdict(
  value: number | null,
  range: { min: number; max: number },
): BenchmarkVerdict | null {
  if (value == null) return null;
  return value < range.min ? "abaixo" : value > range.max ? "acima" : "dentro";
}

/** Market reference for a healthy LTV/CAC. */
export const ltvCacReference = 3;

/** How the UTM medium maps to a channel bucket. */
export function channelOf(medium: string | null, marketplace: boolean): string {
  if (marketplace) return "Marketplace";
  switch (medium) {
    case "paid-social":
    case "cpc":
      return "Mídia paga";
    case "organic":
      return "Orgânico";
    case "social":
      return "Social";
    case "crm":
      return "E-mail";
    case "referral":
      return "Referência";
    default:
      return "Direto";
  }
}
