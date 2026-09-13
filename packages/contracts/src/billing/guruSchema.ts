import { z } from "zod";

const text = z.string().nullish();
const num = z.coerce.number().nullish();

const offerSchema = z
  .object({ offer: z.object({ id: text }).passthrough().nullish() })
  .passthrough();

export const guruSellSchema = z
  .object({
    id: z.string().min(1),
    api_token: text,
    webhook_type: text,
    status: text,
    contact: z.object({ name: text, email: text }).passthrough().nullish(),
    product: offerSchema.nullish(),
    items: z.array(offerSchema).nullish(),
    payment: z
      .object({ total: num, installments: z.object({ qty: num }).passthrough().nullish() })
      .passthrough()
      .nullish(),
    invoice: z
      .object({ status: text, cycle: num, charge_at: text, period_end: text })
      .passthrough()
      .nullish(),
    subscription: z
      .object({
        id: text,
        name: text,
        last_status: text,
        started_at: text,
        charged_times: num,
      })
      .passthrough()
      .nullish(),
    dates: z
      .object({ created_at: text, started_at: text, canceled_at: text })
      .passthrough()
      .nullish(),
  })
  .passthrough();
export type GuruSell = z.infer<typeof guruSellSchema>;

export const guruSubscriptionSchema = z
  .object({
    id: z.string().min(1),
    api_token: text,
    webhook_type: text,
    last_status: text,
    cancel_reason: text,
    dates: z.object({ started_at: text, canceled_at: text }).passthrough().nullish(),
    subscriber: z.object({ name: text, email: text }).passthrough().nullish(),
    last_transaction: z
      .object({ contact: z.object({ email: text }).passthrough().nullish() })
      .passthrough()
      .nullish(),
    product: offerSchema.nullish(),
  })
  .passthrough();
export type GuruSubscription = z.infer<typeof guruSubscriptionSchema>;

export function unwrapGuruBody(body: unknown): unknown {
  if (body && typeof body === "object" && "payload" in body) {
    const inner = (body as { payload: unknown }).payload;
    if (inner && typeof inner === "object") return inner;
  }
  return body;
}
