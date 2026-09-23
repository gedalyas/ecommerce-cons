import { describe, expect, it } from "vitest";
import { connectorCatalog } from "./connectorCatalog";
import { connectorGuides, guideSteps } from "./connectorGuides";

describe("connectorGuides", () => {
  it("gives every connector a step-by-step help", () => {
    for (const connector of connectorCatalog) {
      expect(connectorGuides[connector.key].steps.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("explains the marketplace modalities researched in Bling", () => {
    expect(connectorGuides.amazon.modalities.map((m) => m.label)).toEqual([
      "Amazon (MFN)",
      "FBA Classic",
      "FBA Onsite",
    ]);
    expect(connectorGuides.mercado_livre.modalities.map((m) => m.label)).toEqual([
      "Envio próprio",
      "Full",
    ]);
  });
});

describe("guideSteps", () => {
  it("follows what the button offers in this environment", () => {
    expect(guideSteps({ key: "bling", label: "Bling", availability: "oauth" })[0]).toContain(
      "Conectar",
    );
    expect(guideSteps({ key: "bling", label: "Bling", availability: "request" })[1]).toContain(
      "Solicitar conexão",
    );
  });
});
