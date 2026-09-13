import type { DataSourceStatus } from "../connectors/connectors.types";
import type { ConnectionsSummary } from "./connections.types";

type WithStatus = { status: DataSourceStatus };

const activeStatuses = new Set<DataSourceStatus>(["CONNECTED", "MANUAL"]);

export function connectionsSummaryOf(sources: readonly WithStatus[]): ConnectionsSummary {
  return {
    total: sources.length,
    active: sources.filter((s) => activeStatuses.has(s.status)).length,
    error: sources.filter((s) => s.status === "ERROR").length,
    notConnected: sources.filter((s) => s.status === "NOT_CONNECTED").length,
  };
}

export function hasErrorSource(sources: readonly WithStatus[]): boolean {
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
