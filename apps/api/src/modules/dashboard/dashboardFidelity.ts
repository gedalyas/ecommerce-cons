import type { DataSourceState } from "@ecommerce/contracts/connections";
import {
  connectorFeedLabel,
  connectorOf,
  type ConnectorFeed,
} from "@ecommerce/contracts/connectors";
import type { DashboardMetricKey } from "@ecommerce/contracts/dashboard";
import type { Fidelity } from "@ecommerce/database/enums";

const sales: ConnectorFeed[] = ["orders"];
const media: ConnectorFeed[] = ["ad_spend"];

const feedsByMetric: Record<DashboardMetricKey, readonly ConnectorFeed[]> = {
  totalSold: sales,
  orders: sales,
  averageTicket: sales,
  customers: sales,
  repurchaseRate: sales,
  conversionRate: ["orders", "traffic"],
  marketingInvestment: media,
  roi: [...sales, ...media],
  cac: [...sales, ...media],
  cpa: [...sales, ...media],
  netProfit: [...sales, ...media],
  contributionMargin: [...sales, ...media],
};

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
const best = (a: Fidelity, b: Fidelity) => (fidelityRank[a] <= fidelityRank[b] ? a : b);

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
      return { fidelity: "C", reason: null };
  }
}

export function feedFidelity(
  feed: ConnectorFeed,
  sources: readonly DataSourceState[],
): { fidelity: Fidelity; reason: string | null } {
  const providers = sources.filter((s) => connectorOf(s.connectorKey).feeds.includes(feed));
  let fidelity: Fidelity = "C";
  let reason: string | null =
    `nenhuma fonte de ${connectorFeedLabel[feed].toLowerCase()} conectada`;
  for (const source of providers) {
    const result = sourceFidelity(source);
    if (fidelityRank[result.fidelity] < fidelityRank[fidelity]) {
      fidelity = best(fidelity, result.fidelity);
      reason = result.reason;
    }
  }
  return { fidelity, reason };
}

export function fidelityFor(
  key: DashboardMetricKey,
  sources: readonly DataSourceState[],
): { fidelity: Fidelity; note: string } {
  let fidelity: Fidelity = "A";
  const reasons: string[] = [];
  for (const feed of feedsByMetric[key]) {
    const result = feedFidelity(feed, sources);
    fidelity = worst(fidelity, result.fidelity);
    if (result.reason) reasons.push(result.reason);
  }
  if (usesInformedCosts.has(key)) {
    fidelity = worst(fidelity, "B");
    reasons.push("custos e taxas informados pelo cliente");
  }
  const feeds = feedsByMetric[key].map((f) => connectorFeedLabel[f].toLowerCase()).join(", ");
  const base = `Nível ${fidelity} — calculado sobre ${feeds}`;
  return { fidelity, note: reasons.length ? `${base}; ${reasons.join("; ")}.` : `${base}.` };
}
