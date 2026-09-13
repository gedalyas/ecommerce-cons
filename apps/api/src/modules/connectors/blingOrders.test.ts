import { describe, expect, it } from "vitest";
import {
  blingOrderInputOf,
  defaultStatusMap,
  discountOf,
  guessStatusTarget,
  type BlingOrder,
} from "./blingOrders";

const order: BlingOrder = {
  id: 501,
  numero: 1200,
  data: "2026-09-03",
  total: 289.8,
  totalProdutos: 259.8,
  desconto: { valor: 10, unidade: "REAL" },
  transporte: { frete: 40, etiqueta: { municipio: "Recife", uf: "pe" } },
  situacao: { id: 9 },
  loja: { id: 205 },
  contato: { id: 77, nome: "Bia ERP" },
  itens: [
    {
      codigo: "MANTA-AZ",
      descricao: "Manta azul",
      quantidade: 2,
      valor: 129.9,
      produto: { id: 1 },
    },
  ],
};
const contact = {
  id: 77,
  nome: "Bia Silva",
  email: "Bia@Exemplo.com",
  endereco: { geral: { municipio: "Olinda", uf: "PE" } },
};

describe("guessStatusTarget / defaultStatusMap", () => {
  it("reads the usual Bling situation names", () => {
    expect(guessStatusTarget("Em aberto")).toBe("PENDING");
    expect(guessStatusTarget("Atendido")).toBe("PAID");
    expect(guessStatusTarget("Cancelado")).toBe("CANCELLED");
    expect(guessStatusTarget("Devolução")).toBe("REFUNDED");
    expect(guessStatusTarget("Verificado")).toBe("PAID");
    expect(guessStatusTarget("Qualquer coisa")).toBe("PENDING");
    expect(
      defaultStatusMap([
        { id: "6", label: "Em aberto" },
        { id: "9", label: "Atendido" },
      ]),
    ).toEqual({
      "6": "PENDING",
      "9": "PAID",
    });
  });
});

describe("blingOrderInputOf", () => {
  it("maps an order with its contact, the mapped status and the channel name", () => {
    const input = blingOrderInputOf(order, contact, { "9": "PAID" }, { "205": "Mercado Livre" });
    expect(input).toMatchObject({
      number: "#1200",
      placedAt: "2026-09-03",
      status: "PAID",
      email: "bia@exemplo.com",
      customerName: "Bia Silva",
      city: "Recife",
      province: "PE",
      salesPlatform: "MARKETPLACE",
      channel: "Mercado Livre",
      shipping: 40,
      discount: 10,
      productRevenue: 259.8,
      totalPrice: 289.8,
    });
    expect(input?.items[0]).toEqual({
      sku: "MANTA-AZ",
      productName: "Manta azul",
      category: "Sem categoria",
      quantity: 2,
      unitPrice: 129.9,
      unitCost: null,
    });
  });
  it("skips ignored situations and orders without an e-mail", () => {
    expect(blingOrderInputOf(order, contact, { "9": "IGNORE" }, {})).toBeNull();
    expect(blingOrderInputOf(order, null, { "9": "PAID" }, {})).toBeNull();
  });
  it("falls back to Bling as the channel and PENDING for an unmapped situation", () => {
    const input = blingOrderInputOf({ ...order, loja: null }, contact, {}, {});
    expect(input?.channel).toBe("Bling");
    expect(input?.salesPlatform).toBe("ECOMMERCE");
    expect(input?.status).toBe("PENDING");
  });
  it("computes percentage discounts", () => {
    expect(
      discountOf({ id: 1, totalProdutos: 200, desconto: { valor: 5, unidade: "PERCENTUAL" } }),
    ).toBe(10);
    expect(discountOf({ id: 1, desconto: "7,50" })).toBe(7.5);
  });
});
