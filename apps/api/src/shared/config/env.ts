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
  API_PUBLIC_URL: z.string().url().default("http://localhost:3001"),
  CREDENTIALS_KEY: z.string().min(1),
  CONNECTOR_USER_AGENT: z.string().default("E-commerce Insights (contato@ecommerce-insights.dev)"),
  CONNECTOR_BACKFILL_MONTHS: z.coerce.number().int().min(1).max(60).default(18),
  NUVEMSHOP_APP_ID: z.string().default(""),
  NUVEMSHOP_CLIENT_SECRET: z.string().default(""),
  NUVEMSHOP_AUTH_URL: z.string().url().default("https://www.nuvemshop.com.br"),
  NUVEMSHOP_API_URL: z.string().url().default("https://api.nuvemshop.com.br/v1"),
  BLING_CLIENT_ID: z.string().default(""),
  BLING_CLIENT_SECRET: z.string().default(""),
  BLING_AUTH_URL: z.string().url().default("https://www.bling.com.br"),
  BLING_API_URL: z.string().url().default("https://www.bling.com.br/Api/v3"),
  BLING_MIN_INTERVAL_MS: z.coerce.number().int().min(0).max(5000).default(350),
  GOOGLE_CLIENT_ID: z.string().default(""),
  GOOGLE_CLIENT_SECRET: z.string().default(""),
  GOOGLE_AUTH_URL: z.string().url().default("https://accounts.google.com/o/oauth2/v2/auth"),
  GOOGLE_TOKEN_URL: z.string().url().default("https://oauth2.googleapis.com/token"),
  GOOGLE_ADS_API_URL: z.string().url().default("https://googleads.googleapis.com/v19"),
  GOOGLE_ADS_DEVELOPER_TOKEN: z.string().default(""),
  GOOGLE_ADS_LOGIN_CUSTOMER_ID: z.string().default(""),
  GA4_DATA_API_URL: z.string().url().default("https://analyticsdata.googleapis.com/v1beta"),
  GA4_ADMIN_API_URL: z.string().url().default("https://analyticsadmin.googleapis.com/v1beta"),
  META_APP_ID: z.string().default(""),
  META_APP_SECRET: z.string().default(""),
  META_AUTH_URL: z.string().url().default("https://www.facebook.com/v21.0/dialog/oauth"),
  META_GRAPH_URL: z.string().url().default("https://graph.facebook.com/v21.0"),
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
