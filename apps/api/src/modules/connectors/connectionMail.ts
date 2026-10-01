import type { MailMessage } from "@/shared/mail/mailer.types";

const PRODUCT = "E-commerce Insights";

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export const connectionsLink = (appUrl: string) => `${appUrl.replace(/\/$/, "")}/integracoes`;

export type ConnectionFailedMailInput = {
  to: string;
  name: string;
  storeName: string;
  connector: string;
  message: string;
  link: string;
};

export function connectionFailedMail(input: ConnectionFailedMailInput): MailMessage {
  const intro = `Olá, ${input.name}. A conexão da loja ${input.storeName} com ${input.connector} parou de sincronizar no ${PRODUCT}.`;
  const reason = `Motivo informado pela plataforma: ${input.message}`;
  const action = `Na maioria dos casos basta reconectar — a plataforma pede uma nova autorização de tempos em tempos. Abra Integrações e clique em Reconectar em ${input.connector}:`;
  const outro =
    "Os dados já importados continuam nos painéis; só as novidades ficam paradas até a reconexão.";
  return {
    to: input.to,
    subject: `${input.connector} parou de sincronizar · ${PRODUCT}`,
    text: [intro, "", reason, "", action, input.link, "", outro].join("\n"),
    html: [
      `<p>${escapeHtml(intro)}</p>`,
      `<p>${escapeHtml(reason)}</p>`,
      `<p>${escapeHtml(action)}</p>`,
      `<p><a href="${escapeHtml(input.link)}">Reconectar ${escapeHtml(input.connector)}</a></p>`,
      `<p>${escapeHtml(outro)}</p>`,
    ].join("\n"),
  };
}
