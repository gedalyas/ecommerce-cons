import { describe, expect, it } from "vitest";
import type { DataSourceState } from "@ecommerce/contracts/connections";
import { feedFidelity, fidelityFor } from "./dashboardFidelity";

const source = (
  connectorKey: DataSourceState["connectorKey"],
  status: DataSourceState["status"],
  syncLabel = "hoje às 03:12",
): DataSourceState => ({ connectorKey, name: connectorKey, kind: "x", status, syncLabel });

const sources: DataSourceState[] = [
  source("shopify", "CONNECTED"),
  source("meta_ads", "ERROR", "há 6 dias"),
  source("google_ads", "NOT_CONNECTED", "—"),
  source("ga4", "CONNECTED"),
  source("manual_csv", "MANUAL", "hoje às 10:00"),
];

describe("feedFidelity", () => {
  it("takes the best source that provides the feed", () => {
    expect(feedFidelity("orders", sources)).toEqual({ fidelity: "A", reason: null });
    expect(feedFidelity("ad_spend", sources).fidelity).toBe("B");
    expect(feedFidelity("ad_spend", [source("meta_ads", "ERROR", "há 6 dias")]).reason).toContain(
      "sem sincronizar",
    );
  });

  it("is C with a reason when nothing provides the feed", () => {
    expect(feedFidelity("traffic", [source("shopify", "CONNECTED")])).toEqual({
      fidelity: "C",
      reason: "nenhuma fonte de tráfego conectada",
    });
  });
});

describe("fidelityFor", () => {
  it("is A when every feed of the metric has a connected source", () => {
    expect(fidelityFor("totalSold", sources)).toEqual({
      fidelity: "A",
      note: "Nível A — calculado sobre pedidos.",
    });
  });

  it("degrades to the weakest feed and explains it", () => {
    const result = fidelityFor("marketingInvestment", sources);
    expect(result.fidelity).toBe("B");
    expect(result.note).toContain("Nível B");
  });

  it("caps metrics that depend on informed costs at B", () => {
    const healthy = sources.map((s) => ({ ...s, status: "CONNECTED" as const }));
    const result = fidelityFor("netProfit", healthy);
    expect(result.fidelity).toBe("B");
    expect(result.note).toContain("custos e taxas informados pelo cliente");
  });

  it("is C when a feed has no source at all", () => {
    expect(fidelityFor("conversionRate", [source("shopify", "CONNECTED")]).fidelity).toBe("C");
  });
});
