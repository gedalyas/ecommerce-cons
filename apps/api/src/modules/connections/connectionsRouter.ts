import { Router } from "express";
import { asyncHandler } from "@/shared/http/asyncHandler";
import { connectionsController, type ConnectionsDependencies } from "./connectionsController";

export function createConnectionsRouter(deps: ConnectionsDependencies): Router {
  const router = Router();
  const controller = connectionsController(deps);
  router.get("/connections", asyncHandler(controller.screen));
  router.get("/connections/health", asyncHandler(controller.health));
  router.post("/connections/:key/request", asyncHandler(controller.request));
  return router;
}
