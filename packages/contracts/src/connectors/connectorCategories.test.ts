import { describe, expect, it } from "vitest";
import {
  connectorCategories,
  connectorsOfCategory,
  isRecommendedConnector,
  recommendedConnectors,
  searchConnectors,
  searchSuggestions,
} from "./connectorCategories";
import { connectorCatalog } from "./connectorCatalog";

describe("connector categories", () => {
  const categoryOf = (key: string) =>
    connectorCategories.find((category) =>
      connectorsOfCategory(connectorCatalog, category).sections.some((s) =>
        s.items.some((c) => c.key === key),
      ),
    ) ?? null;

  it("places every catalogued connector but the spreadsheet in one category", () => {
    const uncategorised = connectorCatalog.filter((c) => categoryOf(c.key) === null);
    expect(uncategorised.map((c) => c.key)).toEqual(["manual_csv"]);
  });

  it("recommends only connectors of the same category", () => {
    for (const category of connectorCategories) {
      for (const key of recommendedConnectors[category]) {
        expect(categoryOf(key)).toBe(category);
      }
    }
    expect(isRecommendedConnector("bling")).toBe(true);
    expect(isRecommendedConnector("omie")).toBe(false);
  });

  it("splits a category into its kinds, in the guide's order", () => {
    const group = connectorsOfCategory(connectorCatalog, "vendas");
    expect(group.sections.map((s) => s.kind)).toEqual([
      "storefront",
      "marketplace",
      "social_commerce",
    ]);
  });
});

describe("searchConnectors, matching", () => {
  const keysFor = (query: string) =>
    searchConnectors(connectorCatalog, query).flatMap((g) =>
      g.sections.flatMap((section) => section.items.map((c) => c.key)),
    );

  it("matches the name, ignoring case and accents", () => {
    expect(keysFor("AMAZ")).toContain("amazon");
    expect(keysFor("analytics")).toContain("ga4");
  });

  it("matches the kind label", () => {
    expect(keysFor("marketplace")).toContain("amazon");
  });

  it("lists every categorised connector on an empty query", () => {
    expect(keysFor("  ")).toHaveLength(connectorCatalog.length - 1);
  });
});

describe("searchConnectors", () => {
  it("groups the matches by category and drops empty categories", () => {
    const groups = searchConnectors(connectorCatalog, "ads");
    expect(groups.map((g) => g.category)).toEqual(["marketing"]);
  });

  it("finds nothing for an unknown platform", () => {
    expect(searchConnectors(connectorCatalog, "xyzzy")).toEqual([]);
  });
});

describe("searchSuggestions", () => {
  it("lists the matches in catalog order, up to the limit", () => {
    const keys = searchSuggestions(connectorCatalog, "mercado", 2).map((c) => c.key);
    expect(keys).toEqual(["mercado_livre", "mercado_livre_full"]);
  });

  it("suggests nothing for an empty query", () => {
    expect(searchSuggestions(connectorCatalog, "  ", 6)).toEqual([]);
  });
});
