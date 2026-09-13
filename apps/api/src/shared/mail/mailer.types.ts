export type MailMessage = { to: string; subject: string; text: string; html: string };

export type Mailer = { send(message: MailMessage): Promise<void> };
