import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { hashPassword } from "../src/passwordHash.ts";

loadEnv({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) });

const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"]! });
const prisma = new PrismaClient({ adapter });

const ADMIN_EMAIL = process.env["ADMIN_EMAIL"] ?? "admin@ecommerce-insights.dev";
const ADMIN_PASSWORD = process.env["ADMIN_PASSWORD"] ?? "admin2026";
const ADMIN_NAME = process.env["ADMIN_NAME"] ?? "Administrador";

async function main() {
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    create: {
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      passwordHash: hashPassword(ADMIN_PASSWORD),
      role: "ADMIN",
    },
    update: { role: "ADMIN" },
  });
  console.log(`admin user ready: ${ADMIN_EMAIL} (password from ADMIN_PASSWORD)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
