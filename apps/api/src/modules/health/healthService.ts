import { prismaClient } from "@ecommerce/database/client";

export async function pingDatabase(): Promise<void> {
  await prismaClient.$queryRaw`select 1`;
}
