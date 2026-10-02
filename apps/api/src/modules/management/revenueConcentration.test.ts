import { describe, expect, it } from "vitest";
import { revenueConcentration } from "./revenueConcentration";

const sale = (channel: string, revenue: number, marketplace = false) => ({
  marketplace,
  channel,
  revenue,
  orders: 1,
});

describe("revenueConcentration", () => {
  it("is the share of the largest channel in the paid revenue", () => {
    expect(
      revenueConcentration([
        sale("Loja", 300),
        sale("Mercado Livre", 600, true),
        sale("Amazon", 100, true),
      ]),
    ).toEqual({ share: 60, channel: "Mercado Livre" });
  });

  it("joins the store's own channels into the Site, as Marketing › Canais does", () => {
    expect(
      revenueConcentration([
        sale("Shopify", 40_000),
        sale("Nuvemshop", 35_000),
        sale("Mercado Livre", 50_000, true),
      ]),
    ).toEqual({ share: 60, channel: "Site" });
  });

  it("is empty without sales", () => {
    expect(revenueConcentration([])).toEqual({ share: null, channel: null });
  });
});
