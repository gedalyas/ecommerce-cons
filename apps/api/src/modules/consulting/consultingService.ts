import { prismaClient } from "@ecommerce/database/client";
import type {
  ConsultingRecommendation,
  ConsultingSection,
  MilestoneCriterion,
  MilestoneSummary,
  SectionKey,
} from "@ecommerce/contracts/consulting";
import { milestoneSummaryOf, toRecommendation, toSection } from "./consultingRows";

const metricSelect = {
  label: true,
  value: true,
  delta: true,
  deltaDirection: true,
  subNote: true,
  fidelity: true,
  fidelityNote: true,
} as const;

const recommendationSelect = { text: true, dueLabel: true, owner: true } as const;

export async function sectionFor(clientId: string, key: SectionKey): Promise<ConsultingSection> {
  const row = await prismaClient.section.findUnique({
    where: { clientId_key: { clientId, key } },
    select: {
      title: true,
      subtitle: true,
      pillars: {
        orderBy: { position: "asc" },
        select: {
          title: true,
          status: true,
          dataPending: true,
          extra: true,
          metrics: { orderBy: { position: "asc" }, select: metricSelect },
          recommendations: {
            where: { doneAt: null },
            orderBy: { position: "asc" },
            select: recommendationSelect,
          },
        },
      },
    },
  });
  if (!row) throw new Error(`Section "${key}" not seeded for client ${clientId}`);
  return toSection(row);
}

export async function milestoneCriteriaFor(clientId: string): Promise<MilestoneCriterion[]> {
  return prismaClient.milestoneCriterion.findMany({
    where: { clientId },
    orderBy: { position: "asc" },
    select: { key: true, name: true, progress: true, achieved: true, note: true },
  });
}

export async function openRecommendationsFor(
  clientId: string,
): Promise<ConsultingRecommendation[]> {
  const rows = await prismaClient.recommendation.findMany({
    where: { clientId, pillarId: null, doneAt: null },
    orderBy: { position: "asc" },
    select: recommendationSelect,
  });
  return rows.map(toRecommendation);
}

export async function milestoneSummary(clientId: string): Promise<MilestoneSummary> {
  return milestoneSummaryOf(await milestoneCriteriaFor(clientId));
}
