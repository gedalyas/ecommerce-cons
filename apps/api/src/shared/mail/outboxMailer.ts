import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Mailer, MailMessage } from "./mailer.types";
import { outboxAttachmentName, outboxFileName, renderOutboxMessage } from "./outboxFile";

export function outboxMailer(dir: string, from: string, now: () => Date): Mailer {
  return {
    async send(message: MailMessage) {
      await mkdir(dir, { recursive: true });
      const file = outboxFileName(now(), message.to);
      await writeFile(join(dir, file), renderOutboxMessage(message, from), "utf8");
      for (const attachment of message.attachments ?? []) {
        await writeFile(
          join(dir, outboxAttachmentName(file, attachment.filename)),
          attachment.content,
        );
      }
    },
  };
}
