/**
 * Seeds the database with the prototype dataset: the consulting layer comes from
 * the module fixtures (src/modules/<x>/<x>Fixture.ts, imported through the
 * contracts), the analytics facts from seedAnalytics.ts. Idempotent: wipes and
 * recreates the single "loja-aurora" client on every run.
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
} from "../apps/web/src/generated/prisma/client.ts";

import {
  dashboardKpis,
  alerts,
  milestoneCriteria,
  openRecommendations,
  monthlySeries,
} from "../apps/web/src/modules/dashboard/contract.ts";
import { moneySection } from "../apps/web/src/modules/money/contract.ts";
import { marketingSection } from "../apps/web/src/modules/marketing/contract.ts";
import { logisticsSection } from "../apps/web/src/modules/logistics/contract.ts";
import { managementSection } from "../apps/web/src/modules/management/contract.ts";
import { connections } from "../apps/web/src/modules/connections/contract.ts";
import { goalsPlan2026 } from "../apps/web/src/modules/goals/contract.ts";
import { influencersSeed } from "../apps/web/src/modules/influencers/contract.ts";
import type { Section } from "../apps/web/src/shared/ui/sectionPage.types.ts";
import type { Metric } from "../apps/web/src/shared/ui/metricTile.types.ts";
import type { Recommendation } from "../apps/web/src/shared/ui/recommendationList.types.ts";
import { seedAnalytics } from "./seedAnalytics.ts";

const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"]! });
const prisma = new PrismaClient({ adapter });

const CLIENT_SLUG = "loja-aurora";

/** UI status values -> Prisma enum. */
const pillarStatus: Record<string, PillarStatus> = {
  done: "DONE",
  "in-progress": "IN_PROGRESS",
  "not-started": "NOT_STARTED",
  blocked: "BLOCKED",
};

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
      kind: c.kind,
      status: c.status,
      lastSyncedAt: c.lastSyncedAt ? new Date(c.lastSyncedAt) : null,
      position: i,
    })),
  });

  await prisma.goal.createMany({
    data: goalsPlan2026.map((m) => ({ clientId: client.id, year: 2026, ...m })),
  });

  for (const influencer of influencersSeed) {
    await prisma.influencer.create({
      data: {
        clientId: client.id,
        name: influencer.name,
        handle: influencer.handle || null,
        status: influencer.status,
        notes: influencer.notes || null,
        rules: {
          create: influencer.rules.map((r, position) => ({
            type: r.type,
            value: r.value,
            startDate: new Date(`${r.startDate}T00:00:00.000Z`),
            endDate: r.endDate ? new Date(`${r.endDate}T00:00:00.000Z`) : null,
            cap: r.cap,
            notes: r.notes || null,
            position,
          })),
        },
        coupons: {
          create: influencer.coupons.map((c) => ({
            code: c.code,
            activeFrom: c.activeFrom ? new Date(`${c.activeFrom}T00:00:00.000Z`) : null,
            activeUntil: c.activeUntil ? new Date(`${c.activeUntil}T00:00:00.000Z`) : null,
          })),
        },
      },
    });
  }

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

  const facts = await seedAnalytics(prisma, client.id);
  console.log(
    `seeded analytics: ${facts.products} products, ${facts.variants} variants, ${facts.customers} customers, ${facts.orders} orders, ${facts.items} items, ${facts.traffic} traffic rows, ${facts.adSpend} ad spend rows, ${facts.costs} cost rules`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
