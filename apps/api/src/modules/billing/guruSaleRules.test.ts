import { describe, expect, it } from "vitest";
import type { GuruSell } from "@ecommerce/contracts/billing";
import {
  cancellationEmail,
  classifyCancellation,
  classifySale,
  isKnownOffer,
  offerIdOf,
  sellFacts,
} from "./guruSaleRules";

const sale = (over: Partial<GuruSell> = {}): GuruSell => ({
  id: "t1",
  status: "approved",
  contact: { name: " Ana Lima ", email: "Ana.Lima@Exemplo.com" },
  items: [{ offer: { id: "offer-a" } }],
  payment: { total: 3000, installments: { qty: 5 } },
  invoice: { status: "paid", period_end: "2026-06-17" },
  subscription: {
    id: "sub_1",
    name: "Acompanhamento",
    last_status: "active",
    started_at: "2026-05-17T14:04:57Z",
  },
  dates: { created_at: "2026-05-10T00:00:00Z", canceled_at: null },
  ...over,
});

describe("classifySale", () => {
  it("activates an approved and paid sale of a known offer", () => {
    expect(classifySale(sale(), ["offer-a"])).toEqual({ kind: "ACTIVATE" });
    expect(classifySale(sale({ invoice: null }), [])).toEqual({ kind: "ACTIVATE" });
  });
  it("ignores unknown offers and non-approved statuses", () => {
    expect(classifySale(sale(), ["offer-b"])).toEqual({ kind: "IGNORE", reason: "offer" });
    expect(classifySale(sale({ status: "waiting_payment" }), [])).toEqual({
      kind: "IGNORE",
      reason: "waiting_payment",
    });
  });
  it("cancels on refund, chargeback or a canceled subscription snapshot", () => {
    expect(classifySale(sale({ status: "refunded" }), [])).toEqual({
      kind: "CANCEL",
      canceledAt: null,
    });
    expect(classifySale(sale({ status: "chargeback" }), []).kind).toBe("CANCEL");
    expect(
      classifySale(
        sale({
          subscription: { id: "sub_1", last_status: "canceled" },
          dates: { canceled_at: "2026-08-14T22:07:36Z" },
        }),
        [],
      ),
    ).toEqual({ kind: "CANCEL", canceledAt: "2026-08-14T22:07:36Z" });
  });
  it("flags past due from the invoice or the subscription", () => {
    expect(classifySale(sale({ invoice: { status: "pastdue" } }), []).kind).toBe("PAST_DUE");
    expect(
      classifySale(
        sale({ status: "refused", subscription: { id: "s", last_status: "pastdue" } }),
        [],
      ).kind,
    ).toBe("PAST_DUE");
  });
});

describe("classifyCancellation", () => {
  it("cancels only on last_status canceled of a known offer", () => {
    expect(
      classifyCancellation(
        { id: "sub_1", last_status: "canceled", dates: { canceled_at: "2026-08-14T22:07:36Z" } },
        [],
      ),
    ).toEqual({ kind: "CANCEL", canceledAt: "2026-08-14T22:07:36Z" });
    expect(classifyCancellation({ id: "sub_1", last_status: "active" }, []).kind).toBe("IGNORE");
    expect(
      classifyCancellation(
        { id: "sub_1", last_status: "canceled", product: { offer: { id: "x" } } },
        ["y"],
      ).kind,
    ).toBe("IGNORE");
  });
});

describe("facts", () => {
  it("normalises the e-mail and takes the earliest start", () => {
    expect(sellFacts(sale())).toEqual({
      email: "ana.lima@exemplo.com",
      contactName: "Ana Lima",
      guruSubscriptionId: "sub_1",
      planName: "Acompanhamento",
      amount: 3000,
      installments: 5,
      startedAt: "2026-05-10T00:00:00Z",
      currentPeriodEnd: "2026-06-17",
    });
  });
  it("reads the offer from items first, then product", () => {
    expect(offerIdOf(sale())).toBe("offer-a");
    expect(offerIdOf({ items: [], product: { offer: { id: "p" } } })).toBe("p");
    expect(isKnownOffer(null, [])).toBe(true);
    expect(isKnownOffer(null, ["a"])).toBe(false);
  });
  it("prefers the last transaction e-mail on a cancellation", () => {
    expect(
      cancellationEmail({
        id: "s",
        subscriber: { email: "B@x.dev" },
        last_transaction: { contact: { email: "A@x.dev" } },
      }),
    ).toBe("a@x.dev");
    expect(cancellationEmail({ id: "s", subscriber: { email: "B@x.dev" } })).toBe("b@x.dev");
  });
});
