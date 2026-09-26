import { describe, expect, it } from "vitest";
import type { ReportDocument } from "@ecommerce/contracts/reports";
import { reportMail } from "./reportMail";

const metric = (value: number, variation: number | null) => ({
  value,
  unit: "currency" as const,
  previous: null,
  variation,
});

const document: ReportDocument = {
  title: "Relatório — Loja <Exemplo>",
  storeName: "Loja <Exemplo>",
  range: { inicio: "2026-09-21", fim: "2026-09-27" },
  generatedAt: "2026-09-28T11:00:00.000Z",
  timezone: "America/Sao_Paulo",
  sections: [
    {
      key: "kpis",
      title: "Indicadores do período",
      blocks: [
        {
          kind: "kpis",
          items: ["A", "B", "C", "D", "E"].map((label) => ({
            label,
            metric: metric(1000, label === "A" ? 7.5 : null),
            goodWhen: "up" as const,
          })),
        },
      ],
    },
  ],
};

const mail = reportMail({
  to: "ana@loja.dev",
  scheduleName: "Reunião de segunda",
  document,
  pdf: Buffer.from("%PDF-"),
  fileName: "relatorio.pdf",
  appUrl: "https://app.exemplo.dev",
  createdBy: "Consultora Exemplo",
});

describe("reportMail", () => {
  it("names the schedule, the store and the period in the subject", () => {
    expect(mail.subject).toBe("Reunião de segunda — Loja <Exemplo> (21/09/26 – 27/09/26)");
  });

  it("sums up the first four indicators in the body and attaches the PDF", () => {
    expect(mail.text).toContain("A: R$");
    expect(mail.text).toContain("(+7,5%)");
    expect(mail.text).not.toContain("E: ");
    expect(mail.attachments).toEqual([
      { filename: "relatorio.pdf", content: Buffer.from("%PDF-"), contentType: "application/pdf" },
    ]);
  });

  it("says whose automation it is, so a recipient knows whom to ask to leave", () => {
    expect(mail.text).toContain("Esta automação é de Consultora Exemplo");
  });

  it("escapes the store's name in the html", () => {
    expect(mail.html).toContain("Loja &#60;Exemplo&#62;");
    expect(mail.html).not.toContain("<Exemplo>");
  });
});
