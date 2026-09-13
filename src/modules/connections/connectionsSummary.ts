import type { ConnectionsSummary, DataSourceState } from "./connections.types";

const activeStatuses = new Set<DataSourceState["status"]>(["CONNECTED", "MANUAL"]);

export function connectionsSummaryOf(sources: readonly DataSourceState[]): ConnectionsSummary {
  return {
    total: sources.length,
    active: sources.filter((s) => activeStatuses.has(s.status)).length,
    error: sources.filter((s) => s.status === "ERROR").length,
    notConnected: sources.filter((s) => s.status === "NOT_CONNECTED").length,
  };
}

export function hasErrorSource(sources: readonly DataSourceState[]): boolean {
  return sources.some((s) => s.status === "ERROR");
}

export function summaryDetail(summary: ConnectionsSummary): string {
  const parts = [
    summary.error > 0 ? `${summary.error} com erro` : null,
    summary.notConnected > 0
      ? `${summary.notConnected} ${summary.notConnected === 1 ? "não conectada" : "não conectadas"}`
      : null,
  ].filter((p) => p !== null);
  return parts.join(", ");
}
