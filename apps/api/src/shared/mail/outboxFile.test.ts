import { describe, expect, it } from "vitest";
import { outboxFileName, renderOutboxMessage } from "./outboxFile";

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
