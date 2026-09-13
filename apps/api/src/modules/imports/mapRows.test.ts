import { describe, expect, it } from "vitest";
import { mapAdSpend, mapOrders, mapTraffic } from "./mapRows";
import { missingRequiredHeaders } from "./rowReader";

const ordersHeader = [
  "numero",
  "data",
  "status",
  "cliente_email",
  "cliente_nome",
  "uf",
  "pagamento",
  "cupons",
  "frete",
  "desconto",
  "sku",
  "produto",
  "quantidade",
  "preco_unitario",
  "custo_unitario",
];

describe("mapOrders", () => {
  it("groups the lines of an order, sums the items and applies shipping and discount", () => {
    const { orders, errors } = mapOrders(ordersHeader, [
      [
        "#1",
        "05/09/2026",
        "pago",
        "Ana@Email.com",
        "Ana",
        "sp",
        "pix",
        "insta10",
        "19,90",
        "10",
        "A-1",
        "Manta",
        "2",
        "100",
        "40",
      ],
      [
        "#1",
        "05/09/2026",
        "pago",
        "ana@email.com",
        "Ana",
        "sp",
        "pix",
        "",
        "",
        "",
        "B-2",
        "Vaso",
        "1",
        "50",
        "",
      ],
      [
        "#2",
        "2026-09-06",
        "cancelado",
        "bia@email.com",
        "Bia",
        "",
        "",
        "",
        "",
        "",
        "A-1",
        "Manta",
        "1",
        "100",
        "",
      ],
    ]);
    expect(errors).toEqual([]);
    expect(orders).toHaveLength(2);
    const [first, second] = orders;
    expect(first).toMatchObject({
      number: "#1",
      placedAt: "2026-09-05",
      status: "PAID",
      email: "ana@email.com",
      province: "SP",
      processingMethod: "PIX",
      coupons: ["INSTA10"],
      productRevenue: 250,
      totalPrice: 259.9,
      rows: [2, 3],
    });
    expect(first!.items).toEqual([
      {
        sku: "A-1",
        productName: "Manta",
        category: "Sem categoria",
        quantity: 2,
        unitPrice: 100,
        unitCost: 40,
      },
      {
        sku: "B-2",
        productName: "Vaso",
        category: "Sem categoria",
        quantity: 1,
        unitPrice: 50,
        unitCost: null,
      },
    ]);
    expect(second).toMatchObject({
      status: "CANCELLED",
      province: "ND",
      processingMethod: "CREDIT_CARD",
      salesPlatform: "ECOMMERCE",
      channel: "Loja",
    });
  });

  it("reports the row and the column of every bad line and keeps the good ones", () => {
    const { orders, errors } = mapOrders(ordersHeader, [
      [
        "#1",
        "31/02/2026",
        "pago",
        "a@b.co",
        "A",
        "",
        "",
        "",
        "",
        "",
        "A-1",
        "Manta",
        "1",
        "10",
        "",
      ],
      [
        "#2",
        "05/09/2026",
        "enviado",
        "a@b.co",
        "A",
        "",
        "",
        "",
        "",
        "",
        "A-1",
        "Manta",
        "1",
        "10",
        "",
      ],
      ["#3", "05/09/2026", "pago", "", "A", "", "", "", "", "", "A-1", "Manta", "1", "10", ""],
      [
        "#4",
        "05/09/2026",
        "pago",
        "a@b.co",
        "A",
        "",
        "",
        "",
        "",
        "",
        "A-1",
        "Manta",
        "x",
        "10",
        "",
      ],
      [
        "#5",
        "05/09/2026",
        "pago",
        "a@b.co",
        "A",
        "",
        "",
        "",
        "",
        "",
        "A-1",
        "Manta",
        "1",
        "10",
        "",
      ],
    ]);
    expect(orders.map((o) => o.number)).toEqual(["#5"]);
    expect(errors.map((e) => e.row)).toEqual([2, 3, 4, 5]);
    expect(errors[0]!.message).toContain('coluna "data"');
    expect(errors[1]!.message).toContain("aceita pago, pendente");
    expect(errors[2]!.message).toContain('"cliente_email" é obrigatória');
    expect(errors[3]!.message).toContain("inteiro inválido");
  });
});

describe("mapAdSpend", () => {
  it("fills the ids from the names when absent", () => {
    const { rows, errors } = mapAdSpend(
      ["data", "plataforma", "campanha", "investimento", "cliques"],
      [["05/09/2026", "Meta", "Inverno", "1.500,00", "340"]],
    );
    expect(errors).toEqual([]);
    expect(rows[0]).toMatchObject({
      platform: "META",
      campaignId: "Inverno",
      adsetId: "Inverno",
      adId: "Inverno",
      spend: 1500,
      platformFee: 0,
      clicks: 340,
      impressions: 0,
    });
  });
});

describe("mapTraffic", () => {
  it("lowercases source and medium and defaults users to sessions", () => {
    const { rows } = mapTraffic(
      ["data", "origem", "meio", "sessoes"],
      [["2026-09-05", "Google", "CPC", "420"]],
    );
    expect(rows[0]).toMatchObject({ source: "google", medium: "cpc", sessions: 420, users: 420 });
  });
});

describe("missingRequiredHeaders", () => {
  it("names the required columns the header lacks, ignoring accents and case", () => {
    expect(missingRequiredHeaders("TRAFFIC", ["Data", "Origem", "Sessões"])).toEqual(["meio"]);
    expect(missingRequiredHeaders("TRAFFIC", ["data", "origem", "meio", "sessoes"])).toEqual([]);
  });
});
