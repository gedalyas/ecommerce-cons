import { describe, expect, it } from "vitest";
import { integrationLabel } from "./integrationLabel";

describe("integrationLabel", () => {
  it("names the platform and the integration the store named", () => {
    expect(integrationLabel("mercado_livre_full", "ML Matriz")).toBe(
      "Mercado Livre Full (ML Matriz)",
    );
  });

  it("keeps the platform alone when the name is the default", () => {
    expect(integrationLabel("bling", "Bling")).toBe("Bling");
    expect(integrationLabel("bling", "  ")).toBe("Bling");
  });
});
