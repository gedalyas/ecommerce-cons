import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Mailer, MailMessage } from "./mailer.types";
import { outboxFileName, renderOutboxMessage } from "./outboxFile";

export function outboxMailer(dir: string, from: string, now: () => Date): Mailer {
  return {
    async send(message: MailMessage) {
      await mkdir(dir, { recursive: true });
      await writeFile(
        join(dir, outboxFileName(now(), message.to)),
        renderOutboxMessage(message, from),
        "utf8",
      );
    },
  };
}
