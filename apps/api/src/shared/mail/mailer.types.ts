export type MailAttachment = { filename: string; content: Buffer; contentType: string };

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments?: MailAttachment[];
};

export type Mailer = { send(message: MailMessage): Promise<void> };
