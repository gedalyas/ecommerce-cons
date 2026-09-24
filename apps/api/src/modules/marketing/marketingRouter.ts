import { Router } from "express";
import { asyncHandler } from "@/shared/http/asyncHandler";
import { marketingController, type MarketingDependencies } from "./marketingController";

export function createMarketingRouter(deps: MarketingDependencies): Router {
  const router = Router();
  const controller = marketingController(deps);
  router.get("/marketing", asyncHandler(controller.screen));
  router.put("/marketing/campaign-tags", asyncHandler(controller.tagCampaign));
  return router;
}
