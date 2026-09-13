import type {
  AccessState,
  BillingScreen,
  ContractSummary,
  GuruSell,
  GuruSubscription,
  SubscriptionSummary,
} from "@ecommerce/contracts/billing";
import { prismaClient, type Prisma } from "@ecommerce/database/client";
import type { SubscriptionStatus } from "@ecommerce/database/enums";
import { inviteFromSale } from "@/modules/admin/contract";
import { recordActivity, type AuditActor } from "@/modules/audit/contract";
import type { Mailer } from "@/shared/mail/mailer.types";
import {
  cancellationEmail,
  classifyCancellation,
  classifySale,
  sellFacts,
  type SaleEvent,
  type SubscriptionFacts,
} from "./guruSaleRules";

export type BillingDependencies = {
  accountToken: string;
  offerIds: readonly string[];
  checkoutUrl: string;
  now: () => Date;
  mailer: Mailer;
  appUrl: string;
  contractFor: (clientId: string) => Promise<ContractSummary | null>;
};

const GURU_ACTOR: AuditActor = { system: "Guru" };

const dateOf = (value: string | null) => (value ? new Date(value) : null);

type Delivery = {
  kind: "SELL" | "SUBSCRIPTION";
  guruId: string;
  email: string | null;
  status: string | null;
  invoiceStatus: string | null;
  payload: unknown;
};

async function storeDelivery(delivery: Delivery): Promise<{ wasProcessed: boolean }> {
  const { guruId } = delivery;
  const existing = await prismaClient.guruWebhook.findUnique({
    where: { guruId },
    select: { processedAt: true },
  });
  const data = {
    kind: delivery.kind,
    email: delivery.email ?? "",
    status: delivery.status ?? "",
    invoiceStatus: delivery.invoiceStatus,
    payload: delivery.payload as Prisma.InputJsonValue,
  };
  await prismaClient.guruWebhook.upsert({
    where: { guruId },
    create: { guruId, ...data },
    update: data,
  });
  return { wasProcessed: Boolean(existing?.processedAt) };
}

const markProcessed = (guruId: string, now: Date) =>
  prismaClient.guruWebhook.update({ where: { guruId }, data: { processedAt: now } });

async function storeIdOfEmail(email: string): Promise<string | null> {
  const user = await prismaClient.user.findUnique({ where: { email }, select: { clientId: true } });
  return user?.clientId ?? null;
}

async function applyEvent(
  email: string,
  event: Exclude<SaleEvent, { kind: "IGNORE" }>,
  facts: Partial<SubscriptionFacts>,
  now: Date,
): Promise<{ clientId: string | null }> {
  const clientId = await storeIdOfEmail(email);
  const status: SubscriptionStatus =
    event.kind === "ACTIVATE" ? "ACTIVE" : event.kind === "PAST_DUE" ? "PAST_DUE" : "CANCELED";
  const common = {
    source: "GURU" as const,
    status,
    lastEventAt: now,
    canceledAt: event.kind === "CANCEL" ? (dateOf(event.canceledAt) ?? now) : null,
    ...(clientId ? { clientId } : {}),
    ...(facts.guruSubscriptionId ? { guruSubscriptionId: facts.guruSubscriptionId } : {}),
    ...(facts.planName ? { planName: facts.planName } : {}),
    ...(facts.contactName ? { contactName: facts.contactName } : {}),
    ...(facts.amount !== undefined && facts.amount !== null ? { amount: facts.amount } : {}),
    ...(facts.installments ? { installments: facts.installments } : {}),
    ...(facts.startedAt ? { startedAt: dateOf(facts.startedAt) } : {}),
    ...(facts.currentPeriodEnd ? { currentPeriodEnd: dateOf(facts.currentPeriodEnd) } : {}),
  };
  await prismaClient.subscription.upsert({
    where: { email },
    create: { email, ...common },
    update: common,
  });
  return { clientId };
}

const auditActionOf = {
  ACTIVATE: "SUBSCRIPTION_ACTIVATED",
  PAST_DUE: "SUBSCRIPTION_PAST_DUE",
  CANCEL: "SUBSCRIPTION_CANCELED",
} as const;

async function inviteIfNewcomer(email: string, deps: BillingDependencies): Promise<void> {
  const user = await prismaClient.user.findUnique({ where: { email }, select: { id: true } });
  if (user) return;
  await inviteFromSale(email, { now: deps.now, mailer: deps.mailer, appUrl: deps.appUrl });
}

export async function receiveSell(sell: GuruSell, deps: BillingDependencies): Promise<void> {
  const facts = sellFacts(sell);
  const { wasProcessed } = await storeDelivery({
    kind: "SELL",
    guruId: sell.id,
    email: facts.email,
    status: sell.status ?? null,
    invoiceStatus: sell.invoice?.status ?? null,
    payload: sell,
  });
  const event = classifySale(sell, deps.offerIds);
  const now = deps.now();
  if (event.kind === "IGNORE" || !facts.email || (event.kind === "ACTIVATE" && wasProcessed)) {
    await markProcessed(sell.id, now);
    return;
  }
  const { clientId } = await applyEvent(facts.email, event, facts, now);
  await recordActivity(GURU_ACTOR, clientId, {
    action: auditActionOf[event.kind],
    email: facts.email,
    plan: facts.planName,
  });
  if (event.kind === "ACTIVATE") await inviteIfNewcomer(facts.email, deps);
  await markProcessed(sell.id, now);
}

export async function receiveSubscription(
  event: GuruSubscription,
  deps: BillingDependencies,
): Promise<void> {
  const email = cancellationEmail(event);
  await storeDelivery({
    kind: "SUBSCRIPTION",
    guruId: event.id,
    email,
    status: event.last_status ?? null,
    invoiceStatus: null,
    payload: event,
  });
  const outcome = classifyCancellation(event, deps.offerIds);
  const now = deps.now();
  if (outcome.kind === "IGNORE" || !email) {
    await markProcessed(event.id, now);
    return;
  }
  const { clientId } = await applyEvent(
    email,
    outcome,
    { guruSubscriptionId: event.id, startedAt: event.dates?.started_at ?? null },
    now,
  );
  await recordActivity(GURU_ACTOR, clientId, {
    action: "SUBSCRIPTION_CANCELED",
    email,
    plan: null,
  });
  await markProcessed(event.id, now);
}

export async function linkSubscriptionToStore(email: string, clientId: string): Promise<void> {
  await prismaClient.subscription.updateMany({
    where: { email, clientId: null },
    data: { clientId },
  });
}

const subscriptionSelect = {
  source: true,
  status: true,
  planName: true,
  startedAt: true,
  currentPeriodEnd: true,
  canceledAt: true,
} as const;

const toSummary = (
  s: Prisma.SubscriptionGetPayload<{ select: typeof subscriptionSelect }>,
): SubscriptionSummary => ({
  source: s.source,
  status: s.status,
  planName: s.planName,
  startedAt: s.startedAt?.toISOString() ?? null,
  currentPeriodEnd: s.currentPeriodEnd?.toISOString() ?? null,
  canceledAt: s.canceledAt?.toISOString() ?? null,
});

export async function subscriptionOf(clientId: string): Promise<SubscriptionSummary | null> {
  const row = await prismaClient.subscription.findUnique({
    where: { clientId },
    select: subscriptionSelect,
  });
  return row ? toSummary(row) : null;
}

export async function accessStateOf(clientId: string): Promise<AccessState> {
  const row = await prismaClient.subscription.findUnique({
    where: { clientId },
    select: { status: true },
  });
  return row?.status ?? "NONE";
}

export async function billingScreen(
  clientId: string,
  deps: Pick<BillingDependencies, "checkoutUrl" | "contractFor">,
): Promise<BillingScreen> {
  const [subscription, contract] = await Promise.all([
    subscriptionOf(clientId),
    deps.contractFor(clientId),
  ]);
  return { subscription, contract, checkoutUrl: deps.checkoutUrl || null };
}
