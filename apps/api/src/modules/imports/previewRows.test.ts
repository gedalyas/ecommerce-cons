import { describe, expect, it } from "vitest";
import { IMPORT_PREVIEW_ROWS } from "@ecommerce/contracts/imports";
import type { AdSpendRow, OrderInput, ProductSheetRow, TrafficRow } from "./importRows.types";
import { adSpendPreview, ordersPreview, productsPreview, trafficPreview } from "./previewRows";

const order = (number: string, placedAt: string): OrderInput => ({
  number,
  placedAt,
  status: "PAID",
  email: "a@b.c",
  customerName: "Ana",
  city: "",
  province: "SP",
  salesPlatform: "ECOMMERCE",
  channel: "Loja",
  gateway: "x",
  processingMethod: "PIX",
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
  coupons: [],
  shipping: 10,
  discount: 0,
  rows: [2],
  items: [
    { sku: "A", productName: "P", category: "C", quantity: 2, unitPrice: 50, unitCost: null },
    { sku: "B", productName: "Q", category: "C", quantity: 1, unitPrice: 20, unitCost: null },
  ],
  productRevenue: 120,
  totalPrice: 130,
});

describe("ordersPreview", () => {
  it("counts orders, spans their dates and shows item totals", () => {
    const preview = ordersPreview([order("#2", "2026-09-05"), order("#1", "2026-09-01")]);
    expect(preview.summary).toEqual({
      count: 2,
      label: "pedidos",
      from: "2026-09-01",
      to: "2026-09-05",
    });
    expect(preview.sample[0]).toEqual({
      number: "#2",
      placedAt: "2026-09-05",
      customer: "Ana",
      items: 3,
      totalPrice: 130,
      status: "Pago",
    });
  });
  it("caps the sample and handles an empty file", () => {
    const many = Array.from({ length: 30 }, (_, i) => order(`#${i}`, "2026-09-01"));
    expect(ordersPreview(many).sample).toHaveLength(IMPORT_PREVIEW_ROWS);
    expect(ordersPreview([]).summary).toEqual({ count: 0, label: "pedidos", from: null, to: null });
  });
});

describe("adSpendPreview / trafficPreview", () => {
  const ad: AdSpendRow = {
    row: 2,
    date: "2026-09-03",
    platform: "META",
    campaignId: "c",
    campaignName: "Manta",
    adsetId: "s",
    adsetName: "s",
    adId: "a",
    adName: "a",
    spend: 150,
    platformFee: 0,
    impressions: 1000,
    clicks: 40,
    conversions: 3,
    attributedRevenue: 900,
  };
  const traffic: TrafficRow = {
    row: 2,
    date: "2026-09-03",
    source: "google",
    medium: "cpc",
    sessions: 420,
    users: 380,
    newUsers: 100,
    viewItem: 200,
    addToCart: 40,
    beginCheckout: 12,
  };
  it("uses singular labels for one row", () => {
    expect(adSpendPreview([ad]).summary.label).toBe("linha de mídia");
    expect(trafficPreview([traffic]).summary.label).toBe("linha de tráfego");
  });
  it("keeps the numbers as numbers and labels the platform", () => {
    expect(adSpendPreview([ad]).sample[0]?.["spend"]).toBe(150);
    expect(adSpendPreview([ad]).sample[0]?.["platform"]).toBe("Meta Ads");
    expect(trafficPreview([traffic]).sample[0]?.["sessions"]).toBe(420);
  });
});

describe("productsPreview", () => {
  const product = (sku: string): ProductSheetRow => ({
    row: 2,
    sku,
    name: null,
    category: "Mantas",
    cost: 10,
    stock: null,
    price: null,
  });

  it("counts products without a date span and samples the first rows", () => {
    const body = productsPreview(Array.from({ length: 12 }, (_, i) => product(`S${i}`)));
    expect(body.summary).toEqual({ count: 12, label: "produtos", from: null, to: null });
    expect(body.sample).toHaveLength(Math.min(12, IMPORT_PREVIEW_ROWS));
    expect(body.sample[0]).toEqual({
      sku: "S0",
      name: null,
      cost: 10,
      stock: null,
      category: "Mantas",
    });
  });
});
