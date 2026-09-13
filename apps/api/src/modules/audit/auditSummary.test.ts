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
