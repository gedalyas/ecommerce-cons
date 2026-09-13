/**
 * Connections orchestrator: the only file of the module that touches Prisma.
 * Server-only.
 */
import { prismaClient } from "@/shared/dependencies/prismaClient";
import type { DataSourceState } from "./connections.types";

export async function dataSourcesFor(clientId: string): Promise<DataSourceState[]> {
  const rows = await prismaClient.dataSource.findMany({
    where: { clientId },
    orderBy: { position: "asc" },
    select: { name: true, kind: true, status: true, syncLabel: true },
  });
  return rows;
}
