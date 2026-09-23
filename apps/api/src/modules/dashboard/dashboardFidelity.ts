import type { DataSourceState } from "@ecommerce/contracts/connections";
import { connectorOf, dataKindLabel, type DataKind } from "@ecommerce/contracts/connectors";
import type { DashboardMetricKey } from "@ecommerce/contracts/dashboard";
import type { Fidelity } from "@ecommerce/database/enums";

const sales: DataKind[] = ["sales"];
const media: DataKind[] = ["ad_spend"];

const kindsByMetric: Record<DashboardMetricKey, readonly DataKind[]> = {
  totalSold: sales,
  orders: sales,
  averageTicket: sales,
  customers: sales,
  repurchaseRate: sales,
  conversionRate: ["sales", "traffic"],
  marketingInvestment: media,
  roi: [...sales, ...media],
  roas: [...sales, ...media],
  mer: [...sales, ...media],
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
  "roas",
  "mer",
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

export function kindFidelity(
  kind: DataKind,
  sources: readonly DataSourceState[],
): { fidelity: Fidelity; reason: string | null } {
  const providers = sources.filter((s) => connectorOf(s.connectorKey).provides.includes(kind));
  let fidelity: Fidelity = "C";
  let reason: string | null = `nenhuma fonte de ${dataKindLabel[kind].toLowerCase()} conectada`;
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
  for (const kind of kindsByMetric[key]) {
    const result = kindFidelity(kind, sources);
    fidelity = worst(fidelity, result.fidelity);
    if (result.reason) reasons.push(result.reason);
  }
  if (usesInformedCosts.has(key)) {
    fidelity = worst(fidelity, "B");
    reasons.push("custos e taxas informados pelo cliente");
  }
  const kinds = kindsByMetric[key].map((k) => dataKindLabel[k].toLowerCase()).join(", ");
  const base = `Nível ${fidelity} — calculado sobre ${kinds}`;
  return { fidelity, note: reasons.length ? `${base}; ${reasons.join("; ")}.` : `${base}.` };
}
