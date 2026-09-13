import { Router } from "express";
import { asyncHandler } from "@/shared/http/asyncHandler";
import { productsController } from "./productsController";

export function createProductsRouter(): Router {
  const router = Router();
  const controller = productsController();
  router.get("/products", asyncHandler(controller.screen));
  return router;
}
