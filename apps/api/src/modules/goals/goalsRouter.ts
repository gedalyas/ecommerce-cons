import { Router } from "express";
import { asyncHandler } from "@/shared/http/asyncHandler";
import { goalsController } from "./goalsController";

export function createGoalsRouter(): Router {
  const router = Router();
  const controller = goalsController();
  router.get("/goals", asyncHandler(controller.screen));
  router.get("/goals/suggestion", asyncHandler(controller.suggestion));
  router.put("/goals/plan", asyncHandler(controller.savePlan));
  return router;
}
