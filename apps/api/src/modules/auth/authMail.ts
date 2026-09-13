import type { UserRole } from "@ecommerce/contracts/auth";
import { userRoleLabel } from "@ecommerce/contracts/auth";
import type { MailMessage } from "@/shared/mail/mailer.types";

const PRODUCT = "E-commerce Insights";

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function invitationLink(appUrl: string, token: string): string {
  return `${appUrl.replace(/\/$/, "")}/cadastro?convite=${encodeURIComponent(token)}`;
}

export type InvitationMailInput = {
  to: string;
  inviterName: string;
  role: UserRole;
  storeName: string | null;
  link: string;
  expiresInDays: number;
};

export function invitationMail(input: InvitationMailInput): MailMessage {
  const what = `${userRoleLabel[input.role].toLowerCase()}${
    input.storeName ? ` da loja ${input.storeName}` : ""
  }`;
  const intro = `${input.inviterName} convidou você para o ${PRODUCT} como ${what}.`;
  const action = "Crie sua conta pelo link abaixo:";
  const expiry = `O link vale por ${input.expiresInDays} dias. Se você não esperava este convite, ignore este e-mail.`;
  return {
    to: input.to,
    subject: `Seu convite para o ${PRODUCT}`,
    text: [intro, "", action, input.link, "", expiry].join("\n"),
    html: [
      `<p>${escapeHtml(intro)}</p>`,
      `<p>${action}</p>`,
      `<p><a href="${escapeHtml(input.link)}">Criar minha conta</a></p>`,
      `<p>${escapeHtml(expiry)}</p>`,
    ].join("\n"),
  };
}
