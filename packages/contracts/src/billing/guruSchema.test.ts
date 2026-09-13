import { describe, expect, it } from "vitest";
import { guruSellSchema, guruSubscriptionSchema, unwrapGuruBody } from "./guruSchema";

describe("unwrapGuruBody", () => {
  it("takes the payload out of the envelope and leaves a raw body alone", () => {
    expect(unwrapGuruBody({ attempts: 1, payload: { id: "t1" } })).toEqual({ id: "t1" });
    expect(unwrapGuruBody({ id: "t1" })).toEqual({ id: "t1" });
    expect(unwrapGuruBody(null)).toBeNull();
  });
});

describe("guruSellSchema", () => {
  it("needs only the id and keeps unknown fields", () => {
    const parsed = guruSellSchema.parse({ id: "t1", anything: { deep: true } });
    expect(parsed.id).toBe("t1");
    expect(parsed).toHaveProperty("anything");
    expect(() => guruSellSchema.parse({ status: "approved" })).toThrow();
  });
  it("coerces numbers that arrive as strings", () => {
    const parsed = guruSellSchema.parse({ id: "t1", payment: { total: "3000" } });
    expect(parsed.payment?.total).toBe(3000);
  });
});

describe("guruSubscriptionSchema", () => {
  it("accepts the cancellation shape", () => {
    const parsed = guruSubscriptionSchema.parse({
      id: "sub_1",
      last_status: "canceled",
      dates: { canceled_at: "2026-08-14T22:07:36Z" },
      last_transaction: { contact: { email: "a@b.c" } },
    });
    expect(parsed.last_transaction?.contact?.email).toBe("a@b.c");
  });
});
