import { formatCurrency, formatNumber, formatPercent } from "@ecommerce/contracts/shared/format";
import type {
  AlertFacts,
  AlertItem,
  ProductWeekPair,
  VariantStock,
  WeekPair,
} from "@ecommerce/contracts/alerts";

export const alertThresholds = {
  dropPercent: 15,
  productDropPercent: 40,
  productMinimumUnits: 10,
  lowStockCoverageDays: 14,
  lowStockMinimumSold30: 10,
  keyVariantShare: 0.1,
  maxProductAlerts: 2,
} as const;

export const dropPercent = ({ current, previous }: WeekPair) =>
  previous > 0 ? ((previous - current) / previous) * 100 : null;

export const coverageDays = (stockQty: number, sold30: number) =>
  sold30 > 0 ? stockQty / (sold30 / 30) : null;

export function salesDropAlert(revenue: WeekPair): AlertItem | null {
  const drop = dropPercent(revenue);
  if (drop == null || drop < alertThresholds.dropPercent) return null;
  return {
    kind: "salesDrop",
    severity: "attention",
    title: `Vendas caíram ${formatPercent(drop, 0)} na última semana`,
    detail: `${formatCurrency(revenue.current)} nos últimos 7 dias contra ${formatCurrency(revenue.previous)} nos 7 anteriores.`,
    origin: "Pedidos",
    to: "/pedidos",
    search: null,
  };
}

export function trafficDropAlert(sessions: WeekPair): AlertItem | null {
  const drop = dropPercent(sessions);
  if (drop == null || drop < alertThresholds.dropPercent) return null;
  return {
    kind: "trafficDrop",
    severity: "attention",
    title: `Tráfego caiu ${formatPercent(drop, 0)} na última semana`,
    detail: `${formatNumber(sessions.current)} sessões nos últimos 7 dias contra ${formatNumber(sessions.previous)} nos 7 anteriores.`,
    origin: "Marketing",
    to: "/marketing",
    search: { aba: "resumo" },
  };
}

export function productSalesDropAlerts(products: ProductWeekPair[]): AlertItem[] {
  return products
    .filter((p) => p.previous >= alertThresholds.productMinimumUnits)
    .map((p) => ({ product: p, drop: dropPercent(p) }))
    .filter((x): x is { product: ProductWeekPair; drop: number } => x.drop != null)
    .filter((x) => x.drop >= alertThresholds.productDropPercent)
    .sort((a, b) => b.product.previous - a.product.previous)
    .slice(0, alertThresholds.maxProductAlerts)
    .map(({ product, drop }) => ({
      kind: "productSalesDrop" as const,
      severity: "review" as const,
      title: `${product.name} vendeu ${formatPercent(drop, 0)} menos na última semana`,
      detail: `${formatNumber(product.current)} unidades nos últimos 7 dias contra ${formatNumber(product.previous)} nos 7 anteriores.`,
      origin: "Produtos",
      to: "/produtos",
      search: { aba: "lista" },
    }));
}

const variantLabel = (v: VariantStock) =>
  v.variantName ? `${v.productName} · ${v.variantName}` : v.productName;

export function lowStockRiskAlert(variants: VariantStock[]): AlertItem | null {
  const atRisk = variants
    .filter(
      (v) =>
        !v.marketplaceStock && v.stockQty > 0 && v.sold30 >= alertThresholds.lowStockMinimumSold30,
    )
    .map((v) => ({ variant: v, days: coverageDays(v.stockQty, v.sold30) ?? Infinity }))
    .filter((x) => x.days < alertThresholds.lowStockCoverageDays)
    .sort((a, b) => a.days - b.days);
  const first = atRisk[0];
  if (!first) return null;
  return {
    kind: "lowStockRisk",
    severity: "attention",
    title: `${formatNumber(atRisk.length)} ${atRisk.length === 1 ? "variante vende bem e está acabando" : "variantes vendem bem e estão acabando"}`,
    detail: `${variantLabel(first.variant)} tem estoque para ${formatNumber(first.days, 0)} dias no ritmo dos últimos 30.`,
    origin: "Logística",
    to: "/produtos",
    search: { aba: "estoque" },
  };
}

export function keyVariantsUnavailableAlert(variants: VariantStock[]): AlertItem | null {
  const selling = variants
    .filter((v) => !v.marketplaceStock && v.sold90 > 0)
    .sort((a, b) => b.sold90 - a.sold90);
  const keyCount = Math.max(1, Math.ceil(selling.length * alertThresholds.keyVariantShare));
  const unavailable = selling.slice(0, keyCount).filter((v) => v.stockQty === 0);
  const first = unavailable[0];
  if (!first) return null;
  return {
    kind: "keyVariantsUnavailable",
    severity: "attention",
    title: `${formatNumber(unavailable.length)} ${unavailable.length === 1 ? "variante importante está indisponível" : "variantes importantes estão indisponíveis"}`,
    detail: `${variantLabel(first)} vendeu ${formatNumber(first.sold90)} unidades em 90 dias e está sem estoque.`,
    origin: "Logística",
    to: "/produtos",
    search: { aba: "estoque" },
  };
}

export function deriveAlerts(facts: AlertFacts): AlertItem[] {
  return [
    salesDropAlert(facts.revenue),
    trafficDropAlert(facts.sessions),
    ...productSalesDropAlerts(facts.products),
    lowStockRiskAlert(facts.variants),
    keyVariantsUnavailableAlert(facts.variants),
  ].filter((a): a is AlertItem => a != null);
}
