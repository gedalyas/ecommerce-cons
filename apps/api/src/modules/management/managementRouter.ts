import { Router } from "express";
import { asyncHandler } from "@/shared/http/asyncHandler";
import { managementController } from "./managementController";

export function createManagementRouter(): Router {
  const router = Router();
  const controller = managementController();
  router.get("/management", asyncHandler(controller.screen));
  return router;
}
