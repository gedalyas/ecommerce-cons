import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

loadEnv({ path: fileURLToPath(new URL("../../.env", import.meta.url)) });

// `prisma generate` runs in environments without a database (Docker build, CI),
// so fall back to a placeholder instead of failing when DATABASE_URL is unset.
// Migrate/introspection commands still require the real value.
const databaseUrl =
  process.env["DATABASE_URL"] ?? "postgresql://placeholder:placeholder@localhost:5432/placeholder";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});
