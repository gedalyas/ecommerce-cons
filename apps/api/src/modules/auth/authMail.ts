import type { ClientMembership, UserRole } from "@ecommerce/contracts/auth";
import { userRoleLabel } from "@ecommerce/contracts/auth";
import { escapeHtml } from "@/shared/mail/escapeHtml";
import type { MailMessage } from "@/shared/mail/mailer.types";

const PRODUCT = "E-commerce Insights";

const pageLink = (appUrl: string, path: string, param: string, token: string) =>
  `${appUrl.replace(/\/$/, "")}${path}?${param}=${encodeURIComponent(token)}`;

export function invitationLink(appUrl: string, token: string): string {
  return pageLink(appUrl, "/cadastro", "convite", token);
}

export function passwordResetLink(appUrl: string, token: string): string {
  return pageLink(appUrl, "/redefinir-senha", "token", token);
}

export type PasswordResetMailInput = {
  to: string;
  name: string;
  link: string;
  expiresInMinutes: number;
};

export function passwordResetMail(input: PasswordResetMailInput): MailMessage {
  const intro = `Olá, ${input.name}. Recebemos um pedido para redefinir sua senha no ${PRODUCT}.`;
  const action = "Escolha uma nova senha pelo link abaixo:";
  const expiry = `O link vale por ${input.expiresInMinutes} minutos e só pode ser usado uma vez. Se você não pediu isso, ignore este e-mail — sua senha continua a mesma.`;
  return {
    to: input.to,
    subject: `Redefinição de senha · ${PRODUCT}`,
    text: [intro, "", action, input.link, "", expiry].join("\n"),
    html: [
      `<p>${escapeHtml(intro)}</p>`,
      `<p>${action}</p>`,
      `<p><a href="${escapeHtml(input.link)}">Redefinir minha senha</a></p>`,
      `<p>${escapeHtml(expiry)}</p>`,
    ].join("\n"),
  };
}

export type InvitationMailInput = {
  to: string;
  inviterName: string;
  role: UserRole;
  membership?: ClientMembership;
  storeName: string | null;
  link: string;
  expiresInDays: number;
};

function invitationIntro(input: InvitationMailInput): string {
  if (input.membership === "MEMBER") {
    return `${input.inviterName} convidou você para a equipe da loja ${input.storeName ?? ""} no ${PRODUCT}.`;
  }
  const what = `${userRoleLabel[input.role].toLowerCase()}${
    input.storeName ? ` da loja ${input.storeName}` : ""
  }`;
  return `${input.inviterName} convidou você para o ${PRODUCT} como ${what}.`;
}

export function invitationMail(input: InvitationMailInput): MailMessage {
  const intro = invitationIntro(input);
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
