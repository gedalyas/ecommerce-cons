import type { DataSourceStatus, PillarStatus } from "./generated/prisma/enums";
import type { PrismaClient } from "./generated/prisma/client";

export type StoreProvisionPlan = {
  pillars: { areaKey: string; key: string; status: PillarStatus }[];
  milestones: { key: string }[];
  dataSources: { connectorKey: string; name: string; kind: string; status: DataSourceStatus }[];
};

type Db = Pick<PrismaClient, "pillar" | "milestoneCriterion" | "dataSource">;

export async function provisionStore(db: Db, clientId: string, plan: StoreProvisionPlan) {
  await db.pillar.createMany({
    data: plan.pillars.map((p, position) => ({ clientId, ...p, position })),
    skipDuplicates: true,
  });
  await db.milestoneCriterion.createMany({
    data: plan.milestones.map((m, position) => ({ clientId, key: m.key, position })),
    skipDuplicates: true,
  });
  await db.dataSource.createMany({
    data: plan.dataSources.map((d, position) => ({ clientId, ...d, position })),
    skipDuplicates: true,
  });
}
