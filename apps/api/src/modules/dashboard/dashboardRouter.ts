import { Router } from "express";
import { asyncHandler } from "@/shared/http/asyncHandler";
import { dashboardController } from "./dashboardController";

export function createDashboardRouter(): Router {
  const router = Router();
  const controller = dashboardController();
  router.get("/dashboard", asyncHandler(controller.overview));
  router.put("/dashboard/layout", asyncHandler(controller.saveLayout));
  return router;
}
