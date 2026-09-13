import type { Request, Response } from "express";
import {
  guruSellSchema,
  guruSubscriptionSchema,
  unwrapGuruBody,
} from "@ecommerce/contracts/billing";
import { authOf } from "@/shared/http/authOf";
import { HttpError } from "@/shared/http/httpError";
import { parseOrThrow } from "@/shared/http/validate";
import {
  billingScreen,
  receiveSell,
  receiveSubscription,
  type BillingDependencies,
} from "./billingService";

function assertAccountToken(body: { api_token?: string | null | undefined }, expected: string) {
  if (!expected) throw new HttpError(503, "Webhook do Guru não configurado (GURU_ACCOUNT_TOKEN).");
  if (!body.api_token) throw new HttpError(401, "Account Token não fornecido no webhook.");
  if (body.api_token !== expected) throw new HttpError(401, "Account Token inválido.");
}

export function billingController(deps: BillingDependencies) {
  return {
    async sell(req: Request, res: Response) {
      const sell = parseOrThrow(guruSellSchema, unwrapGuruBody(req.body));
      assertAccountToken(sell, deps.accountToken);
      await receiveSell(sell, deps);
      res.json({ received: true });
    },
    async subscription(req: Request, res: Response) {
      const event = parseOrThrow(guruSubscriptionSchema, unwrapGuruBody(req.body));
      assertAccountToken(event, deps.accountToken);
      await receiveSubscription(event, deps);
      res.json({ received: true });
    },
    async screen(req: Request, res: Response) {
      res.json(await billingScreen(authOf(req).clientId, deps));
    },
  };
}
