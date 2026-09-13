import type { GuruSell, GuruSubscription } from "@ecommerce/contracts/billing";

export const GURU_APPROVED = "approved";
export const GURU_PAID = "paid";
export const GURU_PASTDUE = "pastdue";
export const GURU_CANCELED = "canceled";
const EXIT_STATUSES = new Set(["refunded", "chargeback"]);

export type SaleEvent =
  | { kind: "ACTIVATE" }
  | { kind: "PAST_DUE" }
  | { kind: "CANCEL"; canceledAt: string | null }
  | { kind: "IGNORE"; reason: string };

export type SubscriptionFacts = {
  email: string | null;
  contactName: string | null;
  guruSubscriptionId: string | null;
  planName: string | null;
  amount: number | null;
  installments: number | null;
  startedAt: string | null;
  currentPeriodEnd: string | null;
};

const lower = (value: string | null | undefined) => value?.trim().toLowerCase() || null;

export function offerIdOf(sell: Pick<GuruSell, "items" | "product">): string | null {
  return sell.items?.[0]?.offer?.id ?? sell.product?.offer?.id ?? null;
}

export function isKnownOffer(offerId: string | null, knownOfferIds: readonly string[]): boolean {
  if (knownOfferIds.length === 0) return true;
  return offerId !== null && knownOfferIds.includes(offerId);
}

export function classifySale(sell: GuruSell, knownOfferIds: readonly string[]): SaleEvent {
  if (!isKnownOffer(offerIdOf(sell), knownOfferIds)) return { kind: "IGNORE", reason: "offer" };
  const status = lower(sell.status);
  const invoice = lower(sell.invoice?.status);
  const subscription = lower(sell.subscription?.last_status);
  if ((status && EXIT_STATUSES.has(status)) || subscription === GURU_CANCELED) {
    return { kind: "CANCEL", canceledAt: sell.dates?.canceled_at ?? null };
  }
  if (status === GURU_APPROVED && (invoice === null || invoice === GURU_PAID)) {
    return { kind: "ACTIVATE" };
  }
  if (invoice === GURU_PASTDUE || subscription === GURU_PASTDUE) return { kind: "PAST_DUE" };
  return { kind: "IGNORE", reason: status ?? "status" };
}

export function classifyCancellation(
  event: GuruSubscription,
  knownOfferIds: readonly string[],
): SaleEvent {
  if (!isKnownOffer(event.product?.offer?.id ?? null, knownOfferIds)) {
    return { kind: "IGNORE", reason: "offer" };
  }
  if (lower(event.last_status) === GURU_CANCELED) {
    return { kind: "CANCEL", canceledAt: event.dates?.canceled_at ?? null };
  }
  return { kind: "IGNORE", reason: event.last_status ?? "status" };
}

const earliest = (dates: (string | null | undefined)[]): string | null => {
  const valid = dates.filter((d): d is string => Boolean(d)).sort();
  return valid[0] ?? null;
};

export function sellFacts(sell: GuruSell): SubscriptionFacts {
  return {
    email: lower(sell.contact?.email),
    contactName: sell.contact?.name?.trim() || null,
    guruSubscriptionId: sell.subscription?.id ?? null,
    planName: sell.subscription?.name?.trim() || null,
    amount: sell.payment?.total ?? null,
    installments: sell.payment?.installments?.qty ?? null,
    startedAt: earliest([
      sell.subscription?.started_at,
      sell.dates?.started_at,
      sell.dates?.created_at,
    ]),
    currentPeriodEnd: sell.invoice?.period_end ?? null,
  };
}

export function cancellationEmail(event: GuruSubscription): string | null {
  return lower(event.last_transaction?.contact?.email) ?? lower(event.subscriber?.email);
}
