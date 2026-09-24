import { describe, expect, it } from "vitest";
import {
  channelRoas,
  channelRoasSummary,
  channelsFromSales,
  salesChannelOptions,
} from "./channelRoas";

const sales = [
  { marketplace: false, channel: "Loja virtual", revenue: 60_000, orders: 300 },
  { marketplace: false, channel: "Loja física", revenue: 4_000, orders: 20 },
  { marketplace: true, channel: "Mercado Livre", revenue: 30_000, orders: 150 },
  { marketplace: true, channel: "Amazon", revenue: 0, orders: 0 },
];

describe("channelsFromSales", () => {
  it("adds up the store's own channels as the site and keeps each marketplace apart", () => {
    expect(channelsFromSales(sales).map((c) => [c.key, c.revenue, c.orders])).toEqual([
      ["site", 64_000, 320],
      ["Mercado Livre", 30_000, 150],
      ["Amazon", 0, 0],
    ]);
  });
});

describe("channelRoas", () => {
  it("divides each channel's sales by the investment pointed at it", () => {
    const rows = channelRoas(channelsFromSales(sales), { site: 16_000 });
    expect(rows.map((r) => [r.label, r.investment, r.roas])).toEqual([
      ["Site", 16_000, 4],
      ["Mercado Livre", 0, null],
    ]);
  });

  it("says a channel without investment has no ROAS instead of dividing by zero", () => {
    expect(channelRoasSummary(channelRoas(channelsFromSales(sales), { site: 16_000 }))).toBe(
      "Site 4,00x · Mercado Livre sem investimento",
    );
  });
});

describe("salesChannelOptions", () => {
  it("offers the site first and each marketplace once, in order", () => {
    expect(salesChannelOptions(["Shopee", "Mercado Livre", "Shopee"])).toEqual([
      { key: "site", label: "Site" },
      { key: "Mercado Livre", label: "Mercado Livre" },
      { key: "Shopee", label: "Shopee" },
    ]);
  });
});
