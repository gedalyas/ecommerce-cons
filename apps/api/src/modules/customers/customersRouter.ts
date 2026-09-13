import { Router } from "express";
import { asyncHandler } from "@/shared/http/asyncHandler";
import { customersController } from "./customersController";

export function createCustomersRouter(): Router {
  const router = Router();
  const controller = customersController();
  router.get("/customers", asyncHandler(controller.screen));
  router.get("/customers/export", asyncHandler(controller.exportRows));
  router.get("/customers/retention", asyncHandler(controller.retention));
  router.post("/customers/segments/refresh", asyncHandler(controller.refreshSegments));
  return router;
}
