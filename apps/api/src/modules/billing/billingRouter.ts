import { Router } from "express";
import { asyncHandler } from "@/shared/http/asyncHandler";
import { billingController } from "./billingController";
import type { BillingDependencies } from "./billingService";

export function createGuruWebhookRouter(deps: BillingDependencies): Router {
  const router = Router();
  const controller = billingController(deps);
  router.post("/webhooks/guru/sells", asyncHandler(controller.sell));
  router.post("/webhooks/guru/subscriptions", asyncHandler(controller.subscription));
  return router;
}

export function createBillingRouter(deps: BillingDependencies): Router {
  const router = Router();
  router.get("/billing", asyncHandler(billingController(deps).screen));
  return router;
}
