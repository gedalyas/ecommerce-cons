import { describe, expect, it } from "vitest";
import { investmentForFilter, salesChannelRows, type ChannelFacts } from "./salesChannelRows";

const current: ChannelFacts = {
  sales: [
    { marketplace: false, channel: "Loja virtual", revenue: 60_000, orders: 300 },
    { marketplace: true, channel: "Mercado Livre", revenue: 40_000, orders: 250 },
  ],
  siteSessions: 20_000,
  investment: { site: 15_000 },
};

const previous: ChannelFacts = {
  sales: [
    { marketplace: false, channel: "Loja virtual", revenue: 50_000, orders: 250 },
    { marketplace: true, channel: "Mercado Livre", revenue: 40_000, orders: 200 },
  ],
  siteSessions: 25_000,
  investment: { site: 12_000 },
};

describe("salesChannelRows", () => {
  it("gives the site its sessions, conversion and ROAS and each marketplace its sales", () => {
    const { rows } = salesChannelRows(current, previous);
    const [site, ml] = rows;
    expect(site).toMatchObject({ label: "Site", sessions: 20_000, conversionRate: 1.5, roas: 4 });
    expect(site?.revenueVariation).toBe(20);
    expect(site?.conversionVariation).toBe(50);
    expect(site?.share).toBe(60);
    expect(ml).toMatchObject({ sessions: null, conversionRate: null, roas: null, aov: 160 });
    expect(ml?.aovVariation).toBe(-20);
  });

  it("closes with the total of every channel and no comparison when it is off", () => {
    const { total, rows } = salesChannelRows(current, null);
    expect(total).toMatchObject({ revenue: 100_000, orders: 550, investment: 15_000, share: 100 });
    expect(total.roas).toBeCloseTo(6.67, 2);
    expect(total.revenueVariation).toBeNull();
    expect(rows[0]?.conversionVariation).toBeNull();
  });

  it("gives a marketplace the ROAS of the campaigns tagged to it", () => {
    const { rows } = salesChannelRows(
      { ...current, investment: { site: 15_000, "Mercado Livre": 4_000 } },
      null,
    );
    expect(rows.find((r) => r.label === "Mercado Livre")).toMatchObject({
      investment: 4_000,
      roas: 10,
    });
  });
});

describe("investmentForFilter", () => {
  const investment = { site: 15_000, "Mercado Livre": 4_000 };

  it("keeps only the investment of the channels the global filter shows", () => {
    expect(investmentForFilter("marketplace", investment)).toEqual({ "Mercado Livre": 4_000 });
    expect(investmentForFilter("ecommerce", investment)).toEqual({ site: 15_000 });
    expect(investmentForFilter("todos", investment)).toEqual(investment);
  });
});
