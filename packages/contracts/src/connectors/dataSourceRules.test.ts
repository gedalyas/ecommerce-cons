import { describe, expect, it } from "vitest";
import {
  blockedKinds,
  choiceProblem,
  choiceSince,
  daysSince,
  keepsCutOnRelease,
  ordersSince,
  switchNotice,
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
    expect(kindOwnership(["customers"], "shopify", {})[0]?.text).toBe(
      "Gerado no sistema, a partir dos pedidos",
    );
    expect(kindOwnership([], "shopify", {})).toEqual([]);
  });
});

describe("choiceProblem", () => {
  it("accepts a source that provides the kind, or none at all", () => {
    expect(choiceProblem("sales", "bling", true)).toBeNull();
    expect(choiceProblem("products", null, false)).toBeNull();
    expect(choiceProblem("sales", "manual_csv", false)).toBeNull();
  });

  it("refuses a source that does not provide the kind, and the shared kinds", () => {
    expect(choiceProblem("sales", "shopify", true)).toBe("Shopify não fornece vendas.");
    expect(choiceProblem("sales", "bling", false)).toBe(
      "Conecte Bling antes de usá-la como fonte.",
    );
    expect(choiceProblem("ad_spend", "meta_ads", true)).toBe(
      "Este tipo de dado aceita várias fontes ao mesmo tempo.",
    );
  });
});

describe("ordersSince", () => {
  const orders = [{ placedAt: "2026-09-22T23:59:00Z" }, { placedAt: "2026-09-23T08:00:00Z" }];

  it("keeps only the orders from the owner's first day on", () => {
    expect(ordersSince(orders, "2026-09-23")).toEqual([orders[1]]);
    expect(ordersSince(orders, null)).toEqual(orders);
  });
});

describe("switchNotice", () => {
  it("explains the date cut when another source held the kind", () => {
    expect(
      switchNotice(
        { kind: "sales", label: "Vendas", owner: "other", ownerLabel: "Planilha" },
        "Bling",
      ),
    ).toBe(
      "A partir de hoje, vendas passam a vir de Bling. O histórico até ontem continua vindo de Planilha.",
    );
  });

  it("says what happens when the store stops using this source", () => {
    expect(
      switchNotice(
        { kind: "products", label: "Produtos", owner: "this", ownerLabel: "Shopify" },
        "Shopify",
      ),
    ).toBe("A partir de hoje, produtos voltam a ser gerados pelo sistema, a partir dos pedidos.");
    expect(
      switchNotice({ kind: "sales", label: "Vendas", owner: "this", ownerLabel: "Bling" }, "Bling"),
    ).toBe("A partir de hoje, vendas ficam sem fonte até você escolher outra.");
  });
});

describe("choiceSince", () => {
  it("keeps the whole history when nobody held the kind, and cuts at today otherwise", () => {
    expect(choiceSince(null, null, "2026-09-23")).toBeNull();
    expect(choiceSince("manual_csv", null, "2026-09-23")).toBe("2026-09-23");
    expect(choiceSince("system", null, "2026-09-23")).toBeNull();
    expect(choiceSince("system", "2026-09-20", "2026-09-23")).toBe("2026-09-23");
  });
});

describe("a kind switched off by the store", () => {
  it("is held by the system: nobody writes it and it is not claimed again", () => {
    const owners = ownersFromRows([{ kind: "sales", source: "system" }]);
    expect(owners).toEqual({ sales: "system" });
    expect(unclaimedKinds(["sales"], owners)).toEqual([]);
    expect(conflictingOwner("sales", "bling", owners)).toBe("system");
    expect(ownerConflictMessage("sales", "system")).toBe(
      "Esta loja desligou a fonte de vendas. Para usar uma fonte, escolha em Conexões.",
    );
    expect(kindOwnership(["sales"], "bling", owners)[0]?.text).toBe("Ainda sem fonte");
  });
});

describe("daysSince", () => {
  it("keeps the traffic days from the owner's first day on", () => {
    const rows = [{ date: "2026-09-22" }, { date: "2026-09-23" }];
    expect(daysSince(rows, "2026-09-23")).toEqual([rows[1]]);
    expect(daysSince(rows, null)).toEqual(rows);
  });
});

describe("keepsCutOnRelease", () => {
  it("keeps the owner row only when a date cut must survive the release", () => {
    expect(keepsCutOnRelease("2026-09-23")).toBe(true);
    expect(keepsCutOnRelease(null)).toBe(false);
  });
});
