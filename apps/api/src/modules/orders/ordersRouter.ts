import { Router } from "express";
import { asyncHandler } from "@/shared/http/asyncHandler";
import { ordersController } from "./ordersController";

export function createOrdersRouter(): Router {
  const router = Router();
  const controller = ordersController();
  router.get("/orders", asyncHandler(controller.screen));
  router.get("/orders/export", asyncHandler(controller.exportRows));
  return router;
}
