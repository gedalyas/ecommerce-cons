import { describe, expect, it } from "vitest";
import {
  coverageDays,
  deriveAlerts,
  dropPercent,
  keyVariantsUnavailableAlert,
  lowStockRiskAlert,
  productSalesDropAlerts,
  salesDropAlert,
  trafficDropAlert,
} from "./alertRules";

const variant = (over: Partial<Parameters<typeof lowStockRiskAlert>[0][number]>) => ({
  productName: "Vaso Terra",
  variantName: "M",
  sku: "AUR-1",
  stockQty: 50,
  sold30: 30,
  sold90: 90,
  marketplaceStock: false,
  ...over,
});

describe("dropPercent and coverageDays", () => {
  it("measures the fall against the previous week", () => {
    expect(dropPercent({ current: 85, previous: 100 })).toBe(15);
    expect(dropPercent({ current: 120, previous: 100 })).toBe(-20);
    expect(dropPercent({ current: 10, previous: 0 })).toBeNull();
  });

  it("converts stock into days at the 30-day pace", () => {
    expect(coverageDays(10, 30)).toBe(10);
    expect(coverageDays(10, 0)).toBeNull();
  });
});

describe("salesDropAlert and trafficDropAlert", () => {
  it("fires at a 15% fall and stays quiet below it", () => {
    expect(salesDropAlert({ current: 85_000, previous: 100_000 })?.kind).toBe("salesDrop");
    expect(salesDropAlert({ current: 90_000, previous: 100_000 })).toBeNull();
    expect(trafficDropAlert({ current: 8_000, previous: 10_000 })?.title).toContain("20%");
  });
});

describe("productSalesDropAlerts", () => {
  it("keeps the two biggest sellers that fell 40% or more, ignoring small ones", () => {
    const alerts = productSalesDropAlerts([
      { name: "A", current: 5, previous: 20 },
      { name: "B", current: 30, previous: 60 },
      { name: "C", current: 1, previous: 5 },
      { name: "D", current: 10, previous: 40 },
    ]);
    expect(alerts.map((a) => a.title.split(" ")[0])).toEqual(["B", "D"]);
  });
});

describe("lowStockRiskAlert", () => {
  it("names the variant that runs out first", () => {
    const alert = lowStockRiskAlert([
      variant({ stockQty: 5, sold30: 30, variantName: "P" }),
      variant({ stockQty: 20, sold30: 30, variantName: "G" }),
      variant({ stockQty: 2, sold30: 3 }),
    ]);
    expect(alert?.title).toContain("1 variante");
    expect(alert?.detail).toContain("Vaso Terra · P");
    expect(alert?.detail).toContain("5 dias");
  });

  it("is null when every variant covers two weeks", () => {
    expect(lowStockRiskAlert([variant({ stockQty: 100, sold30: 30 })])).toBeNull();
  });
});

describe("keyVariantsUnavailableAlert", () => {
  it("looks only at the top 10% sellers of the last 90 days", () => {
    const variants = Array.from({ length: 20 }, (_, i) =>
      variant({ sku: `S${i}`, sold90: 100 - i, stockQty: i === 0 || i === 15 ? 0 : 10 }),
    );
    const alert = keyVariantsUnavailableAlert(variants);
    expect(alert?.title).toContain("1 variante importante");
    expect(alert?.detail).toContain("100 unidades");
  });
});

describe("deriveAlerts", () => {
  it("returns nothing when the store is healthy", () => {
    expect(
      deriveAlerts({
        revenue: { current: 100, previous: 100 },
        sessions: { current: 100, previous: 100 },
        products: [],
        variants: [variant({})],
      }),
    ).toEqual([]);
  });
});

describe("marketplace stock", () => {
  it("never warns about stock the marketplace keeps (Full / FBA)", () => {
    expect(
      lowStockRiskAlert([variant({ stockQty: 5, sold30: 60, marketplaceStock: true })]),
    ).toBeNull();
    expect(
      keyVariantsUnavailableAlert([variant({ stockQty: 0, sold90: 200, marketplaceStock: true })]),
    ).toBeNull();
  });
});

describe("untracked stock", () => {
  it("never warns about a variant whose stock nobody informed", () => {
    expect(lowStockRiskAlert([variant({ stockQty: null, sold30: 60 })])).toBeNull();
    expect(keyVariantsUnavailableAlert([variant({ stockQty: null, sold90: 200 })])).toBeNull();
  });
});
