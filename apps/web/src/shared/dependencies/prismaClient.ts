/**
 * Server-only Prisma client. Only *Service.ts files may import it (lint), and the
 * import-protection rule in vite.config.ts fails the build if a client bundle
 * ever pulls it in.
 * Memoized on globalThis so Vite HMR does not open a new pool on every reload.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const connectionString = process.env["DATABASE_URL"];
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

export const prismaClient = globalForPrisma.prisma ?? createClient();

if (process.env["NODE_ENV"] !== "production") globalForPrisma.prisma = prismaClient;
