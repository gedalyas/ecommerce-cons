import { createTransport } from "nodemailer";
import type { Mailer, MailMessage } from "./mailer.types";

export function smtpMailer(smtpUrl: string, from: string): Mailer {
  const transport = createTransport(smtpUrl);
  return {
    async send(message: MailMessage) {
      await transport.sendMail({ from, ...message });
    },
  };
}
