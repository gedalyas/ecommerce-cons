import { describe, expect, it } from "vitest";
import { connectorCatalog, connectorGroups, connectorKindGuide } from "./connectorCatalog";

describe("connectorGroups", () => {
  it("groups the catalog by kind in the guided order and drops empty groups", () => {
    const groups = connectorGroups(connectorCatalog);
    expect(groups.map((g) => g.kind)).toEqual([
      "storefront",
      "marketplace",
      "erp",
      "paid_media",
      "social",
      "analytics",
      "manual",
    ]);
    expect(groups.map((g) => g.items.length).reduce((a, b) => a + b, 0)).toBe(
      connectorCatalog.length,
    );
    expect(connectorGroups([{ kind: "erp" }, { kind: "storefront" }]).map((g) => g.kind)).toEqual([
      "storefront",
      "erp",
    ]);
  });

  it("gives every kind a step and a hint", () => {
    const orders = Object.values(connectorKindGuide).map((g) => g.order);
    expect(new Set(orders).size).toBe(orders.length);
    for (const guide of Object.values(connectorKindGuide))
      expect(guide.hint.length).toBeGreaterThan(10);
  });
});
