import { describe, expect, it } from "vitest";
import type { DataSourceState } from "@ecommerce/contracts/connections";
import { fidelityFor, kindFidelity } from "./dashboardFidelity";

const source = (
  connectorKey: DataSourceState["connectorKey"],
  status: DataSourceState["status"],
  syncLabel = "hoje às 03:12",
): DataSourceState => ({ connectorKey, name: connectorKey, kind: "x", status, syncLabel });

const sources: DataSourceState[] = [
  source("bling", "CONNECTED"),
  source("meta_ads", "ERROR", "há 6 dias"),
  source("google_ads", "NOT_CONNECTED", "—"),
  source("ga4", "CONNECTED"),
  source("manual_csv", "MANUAL", "hoje às 10:00"),
];

describe("kindFidelity", () => {
  it("takes the best source that provides the kind", () => {
    expect(kindFidelity("sales", sources)).toEqual({ fidelity: "A", reason: null });
    expect(kindFidelity("ad_spend", sources).fidelity).toBe("B");
    expect(kindFidelity("ad_spend", [source("meta_ads", "ERROR", "há 6 dias")]).reason).toContain(
      "sem sincronizar",
    );
  });

  it("is C with a reason when nothing provides the kind", () => {
    expect(kindFidelity("traffic", [source("bling", "CONNECTED")])).toEqual({
      fidelity: "C",
      reason: "nenhuma fonte de tráfego do site conectada",
    });
  });

  it("never counts a storefront as a sales source", () => {
    expect(kindFidelity("sales", [source("shopify", "CONNECTED")]).fidelity).toBe("C");
  });
});

describe("fidelityFor", () => {
  it("is A when every kind of the metric has a connected source", () => {
    expect(fidelityFor("totalSold", sources)).toEqual({
      fidelity: "A",
      note: "Nível A — calculado sobre vendas.",
    });
  });

  it("degrades to the weakest kind and explains it", () => {
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

  it("is C when a kind has no source at all", () => {
    expect(fidelityFor("conversionRate", [source("bling", "CONNECTED")]).fidelity).toBe("C");
  });
});
