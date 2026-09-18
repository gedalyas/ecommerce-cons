import { describe, expect, it } from "vitest";
import { invitationLink, invitationMail, passwordResetLink, passwordResetMail } from "./authMail";

describe("invitationLink", () => {
  it("points to the register page with the token, tolerating a trailing slash", () => {
    expect(invitationLink("http://localhost:8090/", "a+b/c")).toBe(
      "http://localhost:8090/cadastro?convite=a%2Bb%2Fc",
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
  it("invites a team member into the store team", () => {
    const text = invitationMail({
      to: "m@loja.dev",
      inviterName: "Ana",
      role: "CLIENT",
      membership: "MEMBER",
      storeName: "Loja Nova",
      link: "l",
      expiresInDays: 7,
    }).text;
    expect(text).toContain(
      "Ana convidou você para a equipe da loja Loja Nova no E-commerce Insights.",
    );
  });
});

describe("passwordResetLink", () => {
  it("points to the reset page with the token", () => {
    expect(passwordResetLink("http://app", "x y")).toBe("http://app/redefinir-senha?token=x%20y");
  });
});

describe("passwordResetMail", () => {
  const mail = passwordResetMail({
    to: "ana@loja.com.br",
    name: "Ana & Cia",
    link: "http://app/redefinir-senha?token=t",
    expiresInMinutes: 60,
  });
  it("greets by name, carries the link and the expiry", () => {
    expect(mail.subject).toBe("Redefinição de senha · E-commerce Insights");
    expect(mail.text).toContain("Olá, Ana & Cia.");
    expect(mail.text).toContain("http://app/redefinir-senha?token=t");
    expect(mail.text).toContain("vale por 60 minutos");
    expect(mail.html).toContain("Ana &#38; Cia");
  });
});
