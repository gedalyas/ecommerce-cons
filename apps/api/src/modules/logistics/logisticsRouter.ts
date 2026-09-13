import { Router } from "express";
import { asyncHandler } from "@/shared/http/asyncHandler";
import { logisticsController } from "./logisticsController";

export function createLogisticsRouter(): Router {
  const router = Router();
  const controller = logisticsController();
  router.get("/logistics", asyncHandler(controller.screen));
  return router;
}
