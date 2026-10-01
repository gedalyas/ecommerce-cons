import { describe, expect, it } from "vitest";
import { connectionFailedMail, connectionsLink } from "./connectionMail";

describe("connectionFailedMail", () => {
  const mail = connectionFailedMail({
    to: "ana@loja.com.br",
    name: "Ana",
    storeName: "Loja <Nova>",
    connector: "Bling",
    message: "Bling recusou o token (401)",
    link: "http://app/integracoes",
  });

  it("names the store, the connector and the reason, and points to Integrações", () => {
    expect(mail.subject).toBe("Bling parou de sincronizar · E-commerce Insights");
    expect(mail.text).toContain("A conexão da loja Loja <Nova> com Bling parou de sincronizar");
    expect(mail.text).toContain("Motivo informado pela plataforma: Bling recusou o token (401)");
    expect(mail.text).toContain("http://app/integracoes");
  });

  it("escapes the html", () => {
    expect(mail.html).toContain("Loja &#60;Nova&#62;");
    expect(mail.html).toContain('<a href="http://app/integracoes">Reconectar Bling</a>');
  });

  it("builds the link tolerating a trailing slash", () => {
    expect(connectionsLink("http://app/")).toBe("http://app/integracoes");
  });
});
