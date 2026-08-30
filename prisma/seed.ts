/**
 * Seeds the database with the prototype dataset - the same fixture data the UI
 * currently renders from src/features/star/data. Idempotent: wipes and recreates
 * the single "loja-aurora" client on every run.
 *
 * Run with `npm run db:seed` (or `make seed`).
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  type DeltaDirection,
  type Fidelity,
  type PillarStatus,
} from "../src/generated/prisma/client.ts";

import {
  dashboardKpis,
  alerts,
  milestoneCriteria,
  openRecommendations,
  monthlySeries,
} from "../src/features/dashboard/data/dashboard.ts";
import { moneySection } from "../src/features/money/data/money.ts";
import { marketingSection } from "../src/features/marketing/data/marketing.ts";
import { logisticsSection } from "../src/features/logistics/data/logistics.ts";
import { managementSection } from "../src/features/management/data/management.ts";
import { connections } from "../src/features/connections/data/connections.ts";
import type { Section } from "../src/design-system/patterns/SectionPage/types.ts";
import type { Metric } from "../src/design-system/patterns/MetricTile/types.ts";
import type { Recommendation } from "../src/design-system/patterns/RecommendationList/types.ts";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const CLIENT_SLUG = "loja-aurora";

/** UI status values -> Prisma enum. */
const pillarStatus: Record<string, PillarStatus> = {
  done: "DONE",
  "in-progress": "IN_PROGRESS",
  "not-started": "NOT_STARTED",
  blocked: "BLOCKED",
};

const sourceStatus = {
  connected: "CONNECTED",
  error: "ERROR",
  "not-connected": "NOT_CONNECTED",
  manual: "MANUAL",
} as const;

const deltaDirection: Record<string, DeltaDirection> = {
  up: "UP",
  down: "DOWN",
  neutral: "NEUTRAL",
};

function metricData(m: Metric, position: number) {
  return {
    label: m.label,
    value: m.value,
    delta: m.delta ?? null,
    deltaDirection: m.deltaDirection ? deltaDirection[m.deltaDirection]! : null,
    subNote: m.subNote ?? null,
    fidelity: m.fidelity as Fidelity,
    fidelityNote: m.fidelityNote,
    position,
  };
}

function recommendationData(r: Recommendation, position: number) {
  return { text: r.text, dueLabel: r.dueDate, owner: r.owner, position };
}

/** "set/25" -> 2025-09-01. Month labels are pt-BR abbreviations. */
function monthFromLabel(label: string): Date {
  const months = [
    "jan",
    "fev",
    "mar",
    "abr",
    "mai",
    "jun",
    "jul",
    "ago",
    "set",
    "out",
    "nov",
    "dez",
  ];
  const [name = "", yy = "0"] = label.split("/");
  return new Date(Date.UTC(2000 + Number(yy), months.indexOf(name), 1));
}

async function seedSection(clientId: string, key: string, section: Section, position: number) {
  const created = await prisma.section.create({
    data: { clientId, key, title: section.title, subtitle: section.subtitle, position },
  });

  for (const [i, pillar] of section.pillars.entries()) {
    await prisma.pillar.create({
      data: {
        sectionId: created.id,
        key: `${key}-${i + 1}`,
        title: pillar.title,
        status: pillarStatus[pillar.status]!,
        dataPending: pillar.dataPending ?? null,
        extra: pillar.extra ?? null,
        position: i,
        metrics: { create: pillar.kpis.map((m, j) => ({ ...metricData(m, j), clientId })) },
        recommendations: {
          create: pillar.recommendations.map((r, j) => ({ ...recommendationData(r, j), clientId })),
        },
      },
    });
  }
}

async function main() {
  await prisma.client.deleteMany({ where: { slug: CLIENT_SLUG } });

  const client = await prisma.client.create({
    data: { slug: CLIENT_SLUG, name: "Loja Aurora" },
  });

  // Headline KPIs (dashboard top row).
  await prisma.metric.createMany({
    data: dashboardKpis.map((m, i) => ({
      ...metricData(m, i),
      clientId: client.id,
      isHeadline: true,
    })),
  });

  await prisma.alert.createMany({
    data: alerts.map((a, i) => ({
      clientId: client.id,
      icon: a.icon,
      title: a.title,
      detail: a.detail,
      origin: a.origin,
      href: a.to,
      position: i,
    })),
  });

  await prisma.milestoneCriterion.createMany({
    data: milestoneCriteria.map((c, i) => ({
      clientId: client.id,
      key: `criterion-${i + 1}`,
      name: c.name,
      progress: c.progress,
      achieved: c.achieved,
      note: c.note,
      position: i,
    })),
  });

  await prisma.recommendation.createMany({
    data: openRecommendations.map((r, i) => ({ ...recommendationData(r, i), clientId: client.id })),
  });

  await prisma.monthlySnapshot.createMany({
    data: monthlySeries.map((s) => ({
      clientId: client.id,
      month: monthFromLabel(s.month),
      label: s.month,
      revenue: s.revenue,
      margin: s.margin,
    })),
  });

  await prisma.dataSource.createMany({
    data: connections.map((c, i) => ({
      clientId: client.id,
      name: c.name,
      kind: c.type,
      status: sourceStatus[c.status],
      syncLabel: c.sync,
      position: i,
    })),
  });

  await seedSection(client.id, "money", moneySection, 0);
  await seedSection(client.id, "marketing", marketingSection, 1);
  await seedSection(client.id, "logistics", logisticsSection, 2);
  await seedSection(client.id, "management", managementSection, 3);

  const counts = await Promise.all([
    prisma.metric.count(),
    prisma.recommendation.count(),
    prisma.pillar.count(),
    prisma.dataSource.count(),
  ]);
  console.log(
    `seeded client "${CLIENT_SLUG}": ${counts[2]} pillars, ${counts[0]} metrics, ${counts[1]} recommendations, ${counts[3]} data sources`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
