import { describe, expect, it } from "vitest";
import {
  blockedKinds,
  conflictingOwner,
  kindOwnership,
  ownerConflictMessage,
  ownersFromRows,
  unclaimedKinds,
} from "./dataSourceRules";

describe("unclaimedKinds", () => {
  it("claims the exclusive kinds nobody owns yet", () => {
    expect(
      unclaimedKinds(["sales", "products", "stock", "customers"], { products: "shopify" }),
    ).toEqual(["sales", "stock", "customers"]);
  });

  it("never claims investment or social, which several platforms share", () => {
    expect(unclaimedKinds(["ad_spend"], {})).toEqual([]);
    expect(unclaimedKinds(["social"], {})).toEqual([]);
  });
});

describe("conflictingOwner", () => {
  it("names the owner when another source already holds an exclusive kind", () => {
    expect(conflictingOwner("sales", "manual_csv", { sales: "bling" })).toBe("bling");
    expect(conflictingOwner("sales", "bling", { sales: "bling" })).toBeNull();
    expect(conflictingOwner("traffic", "ga4", {})).toBeNull();
  });

  it("never blocks investment, which several platforms share", () => {
    expect(conflictingOwner("ad_spend", "google_ads", { ad_spend: "meta_ads" })).toBeNull();
  });
});

describe("ownerConflictMessage", () => {
  it("names the kind and the owner in Portuguese", () => {
    expect(ownerConflictMessage("sales", "bling")).toBe(
      "A fonte de vendas desta loja é Bling. Para usar outra fonte, troque em Conexões.",
    );
  });
});

describe("ownersFromRows", () => {
  it("keeps the known kinds and sources and drops the rest", () => {
    expect(
      ownersFromRows([
        { kind: "sales", source: "bling" },
        { kind: "stock", source: "unknown" },
        { kind: "weather", source: "bling" },
      ]),
    ).toEqual({ sales: "bling" });
  });
});

describe("blockedKinds", () => {
  it("lists what a source provides but another source owns", () => {
    expect(
      blockedKinds(["sales", "products", "stock"], "bling", {
        sales: "manual_csv",
        products: "bling",
      }),
    ).toEqual(["sales"]);
    expect(blockedKinds(["ad_spend"], "meta_ads", {})).toEqual([]);
  });
});

describe("kindOwnership", () => {
  it("says, per kind a source provides, who holds it today", () => {
    expect(
      kindOwnership(["sales", "products", "stock"], "bling", {
        sales: "manual_csv",
        products: "bling",
      }),
    ).toEqual([
      {
        kind: "sales",
        label: "Vendas",
        owner: "other",
        ownerLabel: "Planilha",
        text: "Hoje vem de Planilha",
      },
      {
        kind: "products",
        label: "Produtos",
        owner: "this",
        ownerLabel: "Bling",
        text: "Vem desta integração",
      },
      { kind: "stock", label: "Estoque", owner: "none", ownerLabel: null, text: "Ainda sem fonte" },
    ]);
  });
});
