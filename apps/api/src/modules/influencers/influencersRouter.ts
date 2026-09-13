import { Router } from "express";
import { asyncHandler } from "@/shared/http/asyncHandler";
import { influencersController } from "./influencersController";

export function createInfluencersRouter(): Router {
  const router = Router();
  const controller = influencersController();
  router.get("/influencers", asyncHandler(controller.screen));
  router.post("/influencers", asyncHandler(controller.create));
  router.put("/influencers/:id", asyncHandler(controller.update));
  router.delete("/influencers/:id", asyncHandler(controller.remove));
  return router;
}
