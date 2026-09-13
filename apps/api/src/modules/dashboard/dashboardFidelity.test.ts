import { describe, expect, it } from "vitest";
import type { DataSourceState } from "@ecommerce/contracts/connections";
import { fidelityFor } from "./dashboardFidelity";

const sources: DataSourceState[] = [
  { name: "Bling", kind: "ERP", status: "CONNECTED", syncLabel: "hoje às 03:12" },
  { name: "Loja", kind: "Plataforma", status: "CONNECTED", syncLabel: "hoje às 03:14" },
  { name: "Meta Ads", kind: "Mídia paga", status: "ERROR", syncLabel: "há 6 dias" },
  { name: "Google Ads", kind: "Mídia paga", status: "CONNECTED", syncLabel: "hoje às 03:20" },
  { name: "Google Analytics", kind: "Analytics", status: "CONNECTED", syncLabel: "hoje às 03:20" },
];

describe("fidelityFor", () => {
  it("is A when every source of the metric is connected", () => {
    expect(fidelityFor("totalSold", sources)).toEqual({
      fidelity: "A",
      note: "Nível A — calculado sobre Bling, Loja.",
    });
  });

  it("degrades to B and names the source when one is in error", () => {
    const result = fidelityFor("marketingInvestment", sources);
    expect(result.fidelity).toBe("B");
    expect(result.note).toContain("Meta Ads sem sincronizar (há 6 dias)");
  });

  it("caps metrics that depend on informed costs at B", () => {
    const healthy = sources.map((s) => ({ ...s, status: "CONNECTED" as const }));
    const result = fidelityFor("netProfit", healthy);
    expect(result.fidelity).toBe("B");
    expect(result.note).toContain("custos e taxas informados pelo cliente");
  });

  it("is C when a required source is missing or not connected", () => {
    expect(
      fidelityFor(
        "conversionRate",
        sources.filter((s) => s.name !== "Google Analytics"),
      ).fidelity,
    ).toBe("C");
    const off = sources.map((s) =>
      s.name === "Loja" ? { ...s, status: "NOT_CONNECTED" as const } : s,
    );
    expect(fidelityFor("orders", off).fidelity).toBe("C");
  });
});
