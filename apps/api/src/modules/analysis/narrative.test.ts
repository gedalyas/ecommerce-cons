import { describe, expect, it } from "vitest";
import { metricValue } from "@ecommerce/contracts/shared/metricValue";
import { computeValues, metricDefinitions } from "@ecommerce/contracts/analysis";
import { narrativeOf, strongestDrivers, titleOf, verdictOf } from "./narrative";

const facts = {
  revenue: 100_000,
  orders: 400,
  capturedOrders: 500,
  repeatOrders: 60,
  items: 800,
  discounts: 5_000,
  productRevenue: 95_000,
  sessions: 20_000,
  users: 16_000,
  newUsers: 11_200,
  adSpend: 20_000,
  adPlatformFee: 300,
  clicks: 10_000,
  impressions: 500_000,
  customers: 380,
  newCustomers: 340,
  salesMarketingCosts: 4_000,
};

describe("computeValues", () => {
  it("derives every driver from the facts", () => {
    const v = computeValues(facts);
    expect(v.conversionRate).toBe(2);
    expect(v.averageTicket).toBe(250);
    expect(v.repurchaseRate).toBe(15);
    expect(v.cancellationRate).toBe(20);
    expect(v.roas).toBeCloseTo(4.93, 2);
    expect(v.totalMarketing).toBe(24_300);
    expect(v.cac).toBeCloseTo(24.3, 2);
    expect(v.newUsersShare).toBe(70);
    expect(v.itemsPerOrder).toBe(2);
    expect(v.cpc).toBe(2.03);
  });
});

describe("verdictOf and titleOf", () => {
  it("reads the direction against goodWhen with a neutral band", () => {
    expect(verdictOf(metricValue("currency", 110, 100), "up")).toBe("positivo");
    expect(verdictOf(metricValue("currency", 110, 100), "down")).toBe("negativo");
    expect(verdictOf(metricValue("currency", 101, 100), "up")).toBe("neutro");
    expect(verdictOf(metricValue("currency", 100, null), "up")).toBe("neutro");
  });

  it("writes the headline with the variation", () => {
    const d = metricDefinitions.totalSold;
    expect(titleOf(d, metricValue("currency", 120, 100))).toBe(
      "Total vendido cresceu 20,0% no período",
    );
    expect(titleOf(d, metricValue("currency", 100, 100))).toBe("Total vendido estável no período");
  });
});

describe("strongestDrivers and narrativeOf", () => {
  const d = metricDefinitions.totalSold;
  const drivers = d.drivers.map((key) => ({
    key,
    label: key,
    unit: "count" as const,
    goodWhen: "up" as const,
    metric: metricValue("count", key === "sessions" ? 150 : 101, 100),
  }));

  it("keeps the drivers that moved, biggest first", () => {
    expect(strongestDrivers(drivers).map((x) => x.key)).toEqual(["sessions"]);
  });

  it("assembles verdict, diagnosis and levers", () => {
    const n = narrativeOf(d, metricValue("currency", 130, 100), drivers, null);
    expect(n.verdict).toBe("positivo");
    expect(n.diagnosis).toContain("sessions subiu 50,0%");
    expect(n.diagnosis).toContain("Sem referência de mercado");
    expect(n.levers.startsWith("Para sustentar o ganho:")).toBe(true);
  });
});
