import {
  areaKeyOfPillar,
  pillarTemplateOf,
  type ConsultingRecommendation,
  type ConsultingSection,
  type LiveKpiValues,
  type ManualKpiInput,
  type MilestoneCriterion,
  type MilestoneSummary,
  type MilestoneUpdateInput,
  type PillarUpdateInput,
  type RecommendationInput,
  type SectionKey,
} from "@ecommerce/contracts/consulting";
import { prismaClient } from "@ecommerce/database/client";
import { HttpError, notFound } from "@/shared/http/httpError";
import {
  buildSection,
  milestoneSummaryOf,
  pillarStatusEnum,
  toMilestone,
  toRecommendation,
  type RecommendationRow,
} from "./consultingRows";

const recommendationSelect = {
  id: true,
  text: true,
  dueDate: true,
  owner: true,
  doneAt: true,
  pillar: { select: { key: true } },
} as const;

type RecommendationRecord = {
  id: string;
  text: string;
  dueDate: Date;
  owner: string;
  doneAt: Date | null;
  pillar: { key: string } | null;
};

const toRow = (r: RecommendationRecord): RecommendationRow => ({
  id: r.id,
  pillarKey: r.pillar?.key ?? null,
  text: r.text,
  dueDate: r.dueDate,
  owner: r.owner,
  doneAt: r.doneAt,
});

export async function sectionFor(
  clientId: string,
  key: SectionKey,
  live: LiveKpiValues,
  canEdit: boolean,
): Promise<ConsultingSection> {
  const [pillars, recommendations, manual] = await Promise.all([
    prismaClient.pillar.findMany({
      where: { clientId, areaKey: key },
      select: { key: true, status: true, dataPending: true },
    }),
    prismaClient.recommendation.findMany({
      where: { clientId, pillar: { areaKey: key } },
      orderBy: [{ dueDate: "asc" }, { position: "asc" }],
      select: recommendationSelect,
    }),
    prismaClient.manualKpiValue.findMany({ where: { clientId } }),
  ]);
  return buildSection(key, {
    pillars,
    recommendations: recommendations.map(toRow),
    manual,
    live,
    canEdit,
  });
}

export async function milestoneCriteriaFor(clientId: string): Promise<MilestoneCriterion[]> {
  const rows = await prismaClient.milestoneCriterion.findMany({
    where: { clientId },
    select: { key: true, progress: true, achieved: true, note: true },
  });
  return toMilestone(rows);
}

export async function milestoneSummary(clientId: string): Promise<MilestoneSummary> {
  return milestoneSummaryOf(await milestoneCriteriaFor(clientId));
}

export async function openRecommendationsFor(
  clientId: string,
): Promise<ConsultingRecommendation[]> {
  const rows = await prismaClient.recommendation.findMany({
    where: { clientId, doneAt: null },
    orderBy: [{ dueDate: "asc" }, { position: "asc" }],
    select: recommendationSelect,
  });
  return rows.map((r) => toRecommendation(toRow(r)));
}

export async function updatePillar(clientId: string, pillarKey: string, input: PillarUpdateInput) {
  const areaKey = areaKeyOfPillar(pillarKey);
  if (!areaKey) throw notFound("Pilar não encontrado");
  const row = await prismaClient.pillar.upsert({
    where: { clientId_key: { clientId, key: pillarKey } },
    create: {
      clientId,
      key: pillarKey,
      areaKey,
      status: pillarStatusEnum[input.status],
      dataPending: input.dataPending || null,
      position: 0,
    },
    update: { status: pillarStatusEnum[input.status], dataPending: input.dataPending || null },
    select: { key: true, status: true, dataPending: true },
  });
  return row;
}

async function pillarIdOf(clientId: string, pillarKey: string | null): Promise<string | null> {
  if (!pillarKey) return null;
  const pillar = await prismaClient.pillar.findUnique({
    where: { clientId_key: { clientId, key: pillarKey } },
    select: { id: true },
  });
  if (!pillar) throw notFound("Pilar não encontrado");
  return pillar.id;
}

export async function createRecommendation(clientId: string, input: RecommendationInput) {
  const pillarId = await pillarIdOf(clientId, input.pillarKey);
  const position = await prismaClient.recommendation.count({ where: { clientId } });
  const row = await prismaClient.recommendation.create({
    data: {
      clientId,
      pillarId,
      text: input.text,
      dueDate: new Date(`${input.dueDate}T00:00:00.000Z`),
      owner: input.owner,
      position,
    },
    select: recommendationSelect,
  });
  return toRecommendation(toRow(row));
}

export async function updateRecommendation(
  clientId: string,
  id: string,
  input: RecommendationInput,
) {
  const pillarId = await pillarIdOf(clientId, input.pillarKey);
  const existing = await prismaClient.recommendation.findFirst({
    where: { clientId, id },
    select: { id: true },
  });
  if (!existing) throw notFound("Recomendação não encontrada");
  const row = await prismaClient.recommendation.update({
    where: { id },
    data: {
      pillarId,
      text: input.text,
      dueDate: new Date(`${input.dueDate}T00:00:00.000Z`),
      owner: input.owner,
    },
    select: recommendationSelect,
  });
  return toRecommendation(toRow(row));
}

export async function setRecommendationDone(
  clientId: string,
  id: string,
  done: boolean,
  now: Date,
) {
  const result = await prismaClient.recommendation.updateMany({
    where: { clientId, id },
    data: { doneAt: done ? now : null },
  });
  if (result.count === 0) throw notFound("Recomendação não encontrada");
}

export async function deleteRecommendation(clientId: string, id: string) {
  const result = await prismaClient.recommendation.deleteMany({ where: { clientId, id } });
  if (result.count === 0) throw notFound("Recomendação não encontrada");
}

export async function updateMilestone(clientId: string, key: string, input: MilestoneUpdateInput) {
  const position = await prismaClient.milestoneCriterion.count({ where: { clientId } });
  await prismaClient.milestoneCriterion.upsert({
    where: { clientId_key: { clientId, key } },
    create: { clientId, key, position, ...input },
    update: input,
  });
  return milestoneCriteriaFor(clientId);
}

export async function setManualKpi(
  clientId: string,
  pillarKey: string,
  kpiKey: string,
  input: ManualKpiInput,
) {
  const template = pillarTemplateOf(pillarKey);
  const kpi = template?.kpis.find((k) => k.key === kpiKey);
  if (!kpi || kpi.source !== "manual")
    throw new HttpError(422, "Este indicador não é informado manualmente.");
  await prismaClient.manualKpiValue.upsert({
    where: { clientId_pillarKey_kpiKey: { clientId, pillarKey, kpiKey } },
    create: { clientId, pillarKey, kpiKey, ...input },
    update: input,
  });
}
