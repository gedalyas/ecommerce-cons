import type { MailMessage } from "./mailer.types";

const safe = (value: string) => value.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");

export function outboxFileName(now: Date, to: string): string {
  return `${now.toISOString().replace(/[:.]/g, "-")}-${safe(to.toLowerCase())}.txt`;
}

export function renderOutboxMessage(message: MailMessage, from: string): string {
  return [
    `From: ${from}`,
    `To: ${message.to}`,
    `Subject: ${message.subject}`,
    "",
    message.text,
    "",
    "----- html -----",
    message.html,
    "",
  ].join("\n");
}
