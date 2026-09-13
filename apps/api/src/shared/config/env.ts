import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must have at least 32 characters"),
  CORS_ORIGINS: z
    .string()
    .default("")
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  APP_URL: z.string().url().default("http://localhost:8080"),
  MAIL_FROM: z.string().min(3).default("E-commerce Insights <no-reply@localhost>"),
  SMTP_URL: z
    .string()
    .default("")
    .transform((value) => value.trim() || null)
    .pipe(z.string().url().nullable()),
  MAIL_OUTBOX_DIR: z.string().min(1).default("outbox"),
  GURU_ACCOUNT_TOKEN: z.string().default(""),
  GURU_OFFER_IDS: z
    .string()
    .default("")
    .transform((value) =>
      value
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  GURU_CHECKOUT_URL: z.string().default(""),
  ZAPSIGN_API_TOKEN: z.string().default(""),
  ZAPSIGN_API_BASE_URL: z.string().url().default("https://api.zapsign.com.br"),
  ZAPSIGN_TEMPLATE_ID: z.string().default(""),
  ZAPSIGN_WEBHOOK_SECRET: z.string().default(""),
  ZAPSIGN_SANDBOX: z
    .string()
    .default("false")
    .transform((value) => value.trim().toLowerCase() === "true"),
});

const productionMailSchema = envSchema.refine(
  (env) => env.NODE_ENV !== "production" || Boolean(env.SMTP_URL),
  { path: ["SMTP_URL"], message: "SMTP_URL is required in production" },
);

export type Env = z.infer<typeof envSchema>;

export function readEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = productionMailSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment: ${issues}`);
  }
  return parsed.data;
}
