import { describe, expect, it } from "vitest";
import { accountCheck, connectionVerdict } from "./connectionCheck";

const accounts = [
  { id: "act_1", label: "Loja · E-commerce" },
  { id: "act_2", label: "Loja · Lojas físicas" },
];

describe("accountCheck", () => {
  it("names the account in use", () => {
    expect(accountCheck(accounts, "act_2", "Meta Ads")).toEqual({
      status: "ok",
      accountLabel: "Loja · Lojas físicas",
    });
  });

  it("refuses an account the access no longer sees", () => {
    expect(accountCheck(accounts, "act_9", "Meta Ads").status).toBe("refused");
  });

  it("falls back to the connection label without accounts or a choice", () => {
    expect(accountCheck([], "123", "Bling · Loja")).toEqual({
      status: "ok",
      accountLabel: "Bling · Loja",
    });
    expect(accountCheck(accounts, null, "Meta Ads")).toEqual({
      status: "ok",
      accountLabel: "Meta Ads",
    });
  });
});

describe("connectionVerdict", () => {
  const rows = (n: number) => [{ kind: "order" as const, label: "Pedidos", rows: n }];

  it("says the data is arriving when rows came in", () => {
    expect(connectionVerdict({ status: "ok", accountLabel: "x" }, rows(12)).tone).toBe("ok");
    expect(connectionVerdict({ status: "unverified" }, rows(3)).tone).toBe("ok");
  });

  it("warns when the connection works but nothing arrived", () => {
    expect(connectionVerdict({ status: "ok", accountLabel: "x" }, rows(0))).toEqual({
      tone: "warning",
      text: "Conectado, mas nenhum dado chegou nos últimos 7 dias.",
    });
  });

  it("asks to reconnect when the access is refused, whatever arrived before", () => {
    expect(connectionVerdict({ status: "refused", message: "recusado" }, rows(50)).tone).toBe(
      "error",
    );
  });

  it("tells a platform that did not answer from a refused access", () => {
    expect(connectionVerdict({ status: "unreachable" }, rows(50))).toEqual({
      tone: "warning",
      text: "A plataforma não respondeu agora — tente de novo em alguns minutos.",
    });
  });
});
