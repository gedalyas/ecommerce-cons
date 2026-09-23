import { describe, expect, it } from "vitest";
import { auditSummary } from "./auditSummary";

describe("auditSummary", () => {
  it("writes one Portuguese sentence per action", () => {
    expect(
      auditSummary({
        action: "INVITATION_CREATED",
        email: "a@b.c",
        role: "CLIENT",
        storeName: "Loja X",
      }),
    ).toBe("Convidou a@b.c como cliente para Loja X");
    expect(
      auditSummary({
        action: "INVITATION_REVOKED",
        email: "c@d.e",
        role: "CONSULTANT",
        storeName: null,
      }),
    ).toBe("Revogou o convite de c@d.e como consultor");
    expect(auditSummary({ action: "CONSULTANTS_ASSIGNED", names: [] })).toBe(
      "Removeu todos os consultores da loja",
    );
    expect(
      auditSummary({ action: "STORE_SCREENS_RELEASED", screens: ["Marketing", "Pedidos"] }),
    ).toBe("Liberou para o cliente as telas: Marketing, Pedidos");
    expect(auditSummary({ action: "STORE_SCREENS_RELEASED", screens: [] })).toBe(
      "Deixou todas as telas em desenvolvimento para o cliente",
    );
    expect(
      auditSummary({
        action: "TEAM_MEMBER_INVITED",
        email: "m@loja.dev",
        areas: ["Marketing (editar)", "Dados (ver)"],
      }),
    ).toBe("Convidou m@loja.dev para a equipe (Marketing (editar), Dados (ver))");
    expect(auditSummary({ action: "TEAM_MEMBER_REMOVED", name: "Bia" })).toBe(
      "Removeu Bia da equipe",
    );
    expect(auditSummary({ action: "USER_IMPERSONATED", name: "Bia", email: "bia@loja.dev" })).toBe(
      "Acessou o sistema como Bia (bia@loja.dev)",
    );
    expect(
      auditSummary({
        action: "IMPORT_RUN",
        kind: "Pedidos",
        fileName: "p.csv",
        imported: 2,
        total: 3,
      }),
    ).toBe("Importou pedidos (p.csv): 2 de 3 linhas");
    expect(
      auditSummary({
        action: "MILESTONE_UPDATED",
        criterion: "Caixa de 90 dias",
        progress: 100,
        achieved: true,
      }),
    ).toBe("Atualizou o critério Caixa de 90 dias: 100%, atingido");
    expect(auditSummary({ action: "RECOMMENDATION_DONE", text: "Conciliar" })).toBe(
      'Concluiu a recomendação "Conciliar"',
    );
  });
  it("truncates long recommendation texts", () => {
    const text = "x".repeat(100);
    expect(auditSummary({ action: "RECOMMENDATION_CREATED", text })).toBe(
      `Criou a recomendação "${"x".repeat(77)}…"`,
    );
  });
});

describe("commercial actions", () => {
  it("describe the subscription and the contract", () => {
    expect(
      auditSummary({ action: "SUBSCRIPTION_ACTIVATED", email: "a@b.c", plan: "Plano X" }),
    ).toBe("Assinatura de a@b.c ativada (Plano X)");
    expect(auditSummary({ action: "SUBSCRIPTION_CANCELED", email: "a@b.c", plan: null })).toBe(
      "Assinatura de a@b.c encerrada",
    );
    expect(auditSummary({ action: "CONTRACT_SIGNED", signerEmail: "a@b.c" })).toBe(
      "Contrato assinado por a@b.c",
    );
  });

  it("describes a data source change", () => {
    expect(
      auditSummary({
        action: "DATA_SOURCE_CHANGED",
        kind: "Vendas",
        source: "Bling",
        since: "23/09/2026",
      }),
    ).toBe("Vendas passam a vir de Bling a partir de 23/09/2026");
    expect(
      auditSummary({
        action: "DATA_SOURCE_CHANGED",
        kind: "Produtos",
        source: null,
        since: "23/09/2026",
      }),
    ).toBe("Produtos deixam de ter fonte própria a partir de 23/09/2026");
    expect(
      auditSummary({
        action: "DATA_SOURCE_CHANGED",
        kind: "Vendas",
        source: "Planilha",
        since: null,
      }),
    ).toBe("Vendas passam a vir de Planilha com todo o histórico");
  });
});
