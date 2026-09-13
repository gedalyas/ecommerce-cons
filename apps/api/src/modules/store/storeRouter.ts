import { Router } from "express";
import { asyncHandler } from "@/shared/http/asyncHandler";
import { storeController, type StoreDependencies } from "./storeController";

export function createStoreOnboardingRouter(deps: StoreDependencies): Router {
  const router = Router();
  const controller = storeController(deps);
  router.post("/stores", asyncHandler(controller.create));
  return router;
}

export function createStoreRouter(deps: StoreDependencies): Router {
  const router = Router();
  const controller = storeController(deps);
  router.get("/store", asyncHandler(controller.current));
  router.put("/store", asyncHandler(controller.update));
  return router;
}
