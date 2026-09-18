import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { connectorCatalog, connectorKindLabel } from "@ecommerce/contracts/connectors";
import { engagementTemplate, milestoneTemplate } from "@ecommerce/contracts/consulting";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { hashPassword } from "../src/passwordHash.ts";
import { provisionStore } from "../src/provisionStore.ts";
import { goalsPlan2026 } from "./fixtures/goalsFixture.ts";
import { influencersSeed } from "./fixtures/influencersFixture.ts";
import { seedAnalytics } from "./seedAnalytics.ts";

loadEnv({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) });

const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"]! });
const prisma = new PrismaClient({ adapter });

const STORE_SLUG = "loja-exemplo";
const PASSWORD = process.env["SEED_USER_PASSWORD"] ?? "exemplo2026";
const CLIENT_EMAIL = "cliente@lojaexemplo.dev";
const CONSULTANT_EMAIL = "consultor@ecommerce-insights.dev";
const MEMBER_EMAIL = "marketing@lojaexemplo.dev";

async function main() {
  await prisma.client.deleteMany({ where: { slug: STORE_SLUG } });
  await prisma.user.deleteMany({
    where: { email: { in: [CLIENT_EMAIL, CONSULTANT_EMAIL, MEMBER_EMAIL] } },
  });

  const client = await prisma.client.create({
    data: {
      slug: STORE_SLUG,
      name: "Loja Exemplo",
      segment: "home",
      platform: "shopify",
      monthlyRevenueBand: "200k_500k",
      onboardedAt: new Date("2026-03-01T12:00:00Z"),
    },
  });

  await provisionStore(prisma, client.id, {
    pillars: engagementTemplate.flatMap((area) =>
      area.pillars.map((p) => ({
        areaKey: area.key,
        key: p.key,
        status: p.blockedByMilestone ? "BLOCKED" : "IN_PROGRESS",
      })),
    ),
    milestones: milestoneTemplate.map((m) => ({ key: m.key })),
    dataSources: connectorCatalog.map((c) => ({
      connectorKey: c.key,
      name: c.label,
      kind: connectorKindLabel[c.kind],
      status: c.key === "manual_csv" ? "MANUAL" : "NOT_CONNECTED",
    })),
  });

  await prisma.user.create({
    data: {
      clientId: client.id,
      email: CLIENT_EMAIL,
      name: "Cliente Exemplo",
      passwordHash: hashPassword(PASSWORD),
      role: "CLIENT",
    },
  });
  await prisma.user.create({
    data: {
      clientId: client.id,
      email: MEMBER_EMAIL,
      name: "Equipe de Marketing",
      passwordHash: hashPassword(PASSWORD),
      role: "CLIENT",
      membership: "MEMBER",
      viewAreas: ["MARKETING", "DATA"],
      editAreas: ["MARKETING"],
    },
  });
  const consultant = await prisma.user.create({
    data: {
      email: CONSULTANT_EMAIL,
      name: "Consultora Exemplo",
      passwordHash: hashPassword(PASSWORD),
      role: "CONSULTANT",
    },
  });
  await prisma.consultantAssignment.create({
    data: { consultantId: consultant.id, clientId: client.id },
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

  const facts = await seedAnalytics(prisma, client.id);
  console.log(
    `dev store "${STORE_SLUG}" ready: users ${CLIENT_EMAIL} (CLIENT, owner), ${MEMBER_EMAIL} (CLIENT, team member: Marketing edit + Dados view) and ${CONSULTANT_EMAIL} (CONSULTANT), password ${PASSWORD}`,
  );
  console.log(
    `facts: ${facts.products} products, ${facts.customers} customers, ${facts.orders} orders, ${facts.traffic} traffic rows, ${facts.adSpend} ad spend rows, ${facts.costs} cost rules`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
