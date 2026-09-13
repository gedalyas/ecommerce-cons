import type { DataSourceState } from "@ecommerce/contracts/connections";
import type { Fidelity } from "@ecommerce/database/enums";
import type { DashboardMetricKey } from "@ecommerce/contracts/dashboard";

/**
 * Which connected sources each metric depends on, by data-source name. A
 * metric is as trustworthy as its weakest source; costs informed by hand cap
 * the seal at B.
 */
const salesSources = ["Bling", "Loja"];
const mediaSources = ["Meta Ads", "Google Ads"];

const sourcesByMetric: Record<DashboardMetricKey, readonly string[]> = {
  totalSold: salesSources,
  orders: salesSources,
  averageTicket: salesSources,
  customers: salesSources,
  repurchaseRate: salesSources,
  conversionRate: ["Loja", "Google Analytics"],
  marketingInvestment: mediaSources,
  roi: [...salesSources, ...mediaSources],
  cac: [...salesSources, ...mediaSources],
  cpa: [...salesSources, ...mediaSources],
  netProfit: [...salesSources, ...mediaSources],
  contributionMargin: [...salesSources, ...mediaSources],
};

/** Metrics that also depend on the cost rules the client informs by hand. */
const usesInformedCosts = new Set<DashboardMetricKey>([
  "netProfit",
  "contributionMargin",
  "marketingInvestment",
  "roi",
  "cac",
  "cpa",
]);

const fidelityRank: Record<Fidelity, number> = { A: 0, B: 1, C: 2 };
const worst = (a: Fidelity, b: Fidelity) => (fidelityRank[a] >= fidelityRank[b] ? a : b);

function sourceFidelity(source: DataSourceState): { fidelity: Fidelity; reason: string | null } {
  switch (source.status) {
    case "CONNECTED":
      return { fidelity: "A", reason: null };
    case "MANUAL":
      return {
        fidelity: "B",
        reason: `${source.name} importado manualmente (${source.syncLabel})`,
      };
    case "ERROR":
      return { fidelity: "B", reason: `${source.name} sem sincronizar (${source.syncLabel})` };
    case "NOT_CONNECTED":
      return { fidelity: "C", reason: `${source.name} não conectado` };
  }
}

export function fidelityFor(
  key: DashboardMetricKey,
  sources: readonly DataSourceState[],
): { fidelity: Fidelity; note: string } {
  let fidelity: Fidelity = "A";
  const reasons: string[] = [];
  for (const name of sourcesByMetric[key]) {
    const source = sources.find((s) => s.name === name);
    if (!source) {
      fidelity = worst(fidelity, "C");
      reasons.push(`${name} não conectado`);
      continue;
    }
    const result = sourceFidelity(source);
    fidelity = worst(fidelity, result.fidelity);
    if (result.reason) reasons.push(result.reason);
  }
  if (usesInformedCosts.has(key)) {
    fidelity = worst(fidelity, "B");
    reasons.push("custos e taxas informados pelo cliente");
  }
  const base = `Nível ${fidelity} — calculado sobre ${sourcesByMetric[key].join(", ")}`;
  return { fidelity, note: reasons.length ? `${base}; ${reasons.join("; ")}.` : `${base}.` };
}
