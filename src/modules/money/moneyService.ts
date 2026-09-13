/**
 * Money orchestrator: the only file of the module that touches Prisma.
 * Server-only.
 */
import { prismaClient } from "@/shared/dependencies/prismaClient";
import type { CostRule } from "./money.types";

const isoDay = (date: Date) => date.toISOString().slice(0, 10);

/** Every cost rule of the client, in the shape the cost engine consumes. */
export async function costRulesFor(clientId: string): Promise<CostRule[]> {
  const rows = await prismaClient.costExpense.findMany({
    where: { clientId },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    businessUnit: r.businessUnit,
    category: r.category,
    subcategory: r.subcategory,
    frequency: r.frequency,
    value: Number(r.value),
    startDate: isoDay(r.startDate),
    endDate: r.endDate ? isoDay(r.endDate) : null,
  }));
}
