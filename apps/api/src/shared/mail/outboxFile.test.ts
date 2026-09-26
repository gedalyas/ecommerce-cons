import { describe, expect, it } from "vitest";
import { outboxAttachmentName, outboxFileName, renderOutboxMessage } from "./outboxFile";

describe("outboxFileName", () => {
  it("is sortable by time and keeps the address readable", () => {
    expect(outboxFileName(new Date("2026-09-13T10:20:30.400Z"), "Ana.Silva@loja.com.br")).toBe(
      "2026-09-13T10-20-30-400Z-ana-silva-loja-com-br.txt",
    );
  });
});

describe("renderOutboxMessage", () => {
  it("writes the headers, the text and the html", () => {
    const out = renderOutboxMessage(
      { to: "a@b.c", subject: "Oi", text: "Olá", html: "<p>Olá</p>" },
      "Insights <no-reply@x>",
    );
    expect(out).toContain("From: Insights <no-reply@x>\nTo: a@b.c\nSubject: Oi\n\nOlá\n");
    expect(out).toContain("----- html -----\n<p>Olá</p>");
  });
});

describe("attachments in the outbox", () => {
  it("lists them in the message and names their file after the message", () => {
    const text = renderOutboxMessage(
      {
        to: "ana@loja.dev",
        subject: "Relatório",
        text: "Segue.",
        html: "<p>Segue.</p>",
        attachments: [
          {
            filename: "relatorio.pdf",
            content: Buffer.from("%PDF-"),
            contentType: "application/pdf",
          },
        ],
      },
      "no-reply@localhost",
    );
    expect(text).toContain("Attachment: relatorio.pdf (5 bytes)");
    expect(
      outboxAttachmentName("2026-09-26T10-00-00-000Z-ana-loja-dev.txt", "relatorio loja.pdf"),
    ).toBe("2026-09-26T10-00-00-000Z-ana-loja-dev-relatorio-loja.pdf");
  });
});
