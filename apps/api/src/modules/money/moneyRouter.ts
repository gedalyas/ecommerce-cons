import { Router } from "express";
import { asyncHandler } from "@/shared/http/asyncHandler";
import { moneyController } from "./moneyController";

export function createMoneyRouter(): Router {
  const router = Router();
  const controller = moneyController();
  router.get("/money", asyncHandler(controller.screen));
  router.get("/money/marketing-cost-lines", asyncHandler(controller.marketingCostLines));
  router.post("/money/costs", asyncHandler(controller.createCost));
  router.put("/money/costs/:id", asyncHandler(controller.updateCost));
  router.delete("/money/costs/:id", asyncHandler(controller.deleteCost));
  return router;
}
