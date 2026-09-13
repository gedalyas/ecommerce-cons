import { describe, expect, it } from "vitest";
import { invitationLink, invitationMail } from "./authMail";

describe("invitationLink", () => {
  it("points to the register page with the token, tolerating a trailing slash", () => {
    expect(invitationLink("http://localhost:8080/", "a+b/c")).toBe(
      "http://localhost:8080/cadastro?convite=a%2Bb%2Fc",
    );
  });
});

describe("invitationMail", () => {
  const mail = invitationMail({
    to: "ana@loja.com.br",
    inviterName: "Marina",
    role: "CLIENT",
    storeName: "Loja <Nova>",
    link: "http://app/cadastro?convite=t",
    expiresInDays: 7,
  });
  it("names the inviter, the role and the store", () => {
    expect(mail.subject).toBe("Seu convite para o E-commerce Insights");
    expect(mail.text).toContain(
      "Marina convidou você para o E-commerce Insights como cliente da loja Loja <Nova>.",
    );
    expect(mail.text).toContain("http://app/cadastro?convite=t");
    expect(mail.text).toContain("vale por 7 dias");
  });
  it("escapes the html", () => {
    expect(mail.html).toContain("Loja &#60;Nova&#62;");
    expect(mail.html).toContain('<a href="http://app/cadastro?convite=t">');
  });
  it("omits the store for a consultant without one", () => {
    const text = invitationMail({
      to: "c@x.dev",
      inviterName: "Admin",
      role: "CONSULTANT",
      storeName: null,
      link: "l",
      expiresInDays: 7,
    }).text;
    expect(text).toContain("como consultor.");
  });
});
