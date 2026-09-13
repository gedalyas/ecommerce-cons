import { resolve } from "node:path";
import type { Env } from "@/shared/config/env";
import type { Mailer } from "./mailer.types";
import { outboxMailer } from "./outboxMailer";
import { smtpMailer } from "./smtpMailer";

export function createMailer(env: Env, now: () => Date): Mailer {
  if (env.SMTP_URL) return smtpMailer(env.SMTP_URL, env.MAIL_FROM);
  return outboxMailer(resolve(env.MAIL_OUTBOX_DIR), env.MAIL_FROM, now);
}
