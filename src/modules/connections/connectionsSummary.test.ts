import { describe, expect, it } from "vitest";
import type { DataSourceState } from "./connections.types";
import { connectionsSummaryOf, hasErrorSource, summaryDetail } from "./connectionsSummary";

const source = (name: string, status: DataSourceState["status"]): DataSourceState => ({
  name,
  kind: "ERP",
  status,
  syncLabel: "hoje às 03:12",
});

const sources = [
  source("Bling", "CONNECTED"),
  source("Meta Ads", "ERROR"),
  source("Instagram", "NOT_CONNECTED"),
  source("Extrato", "MANUAL"),
];

describe("connectionsSummaryOf", () => {
  it("counts connected and manual sources as active", () => {
    expect(connectionsSummaryOf(sources)).toEqual({
      total: 4,
      active: 2,
      error: 1,
      notConnected: 1,
    });
  });
});

describe("hasErrorSource", () => {
  it("flags any source in error", () => {
    expect(hasErrorSource(sources)).toBe(true);
    expect(hasErrorSource([source("Bling", "CONNECTED")])).toBe(false);
  });
});

describe("summaryDetail", () => {
  it("lists the problems and agrees in number", () => {
    expect(summaryDetail({ total: 7, active: 5, error: 1, notConnected: 1 })).toBe(
      "1 com erro, 1 não conectada",
    );
    expect(summaryDetail({ total: 7, active: 5, error: 0, notConnected: 2 })).toBe(
      "2 não conectadas",
    );
    expect(summaryDetail({ total: 7, active: 7, error: 0, notConnected: 0 })).toBe("");
  });
});
