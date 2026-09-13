import { Router } from "express";
import { asyncHandler } from "@/shared/http/asyncHandler";
import { analysisController } from "./analysisController";

export function createAnalysisRouter(): Router {
  const router = Router();
  const controller = analysisController();
  router.get("/analysis", asyncHandler(controller.screen));
  return router;
}
