import { Router } from "express";
import { asyncHandler } from "@/shared/http/asyncHandler";
import { connectorsController } from "./connectorsController";
import type { ConnectorsDependencies } from "./connectorsService";

export function createConnectorsRouter(deps: ConnectorsDependencies): Router {
  const router = Router();
  const controller = connectorsController(deps);
  router.post("/connectors/:key/authorize", asyncHandler(controller.authorize));
  router.post("/connectors/:key/credentials", asyncHandler(controller.credentials));
  router.post("/connectors/:key/sync", asyncHandler(controller.sync));
  router.delete("/connectors/:key", asyncHandler(controller.remove));
  router.get("/data-readiness", asyncHandler(controller.readiness));
  return router;
}

export function createConnectorCallbackRouter(deps: ConnectorsDependencies): Router {
  const router = Router();
  router.get("/connectors/:key/callback", asyncHandler(connectorsController(deps).callback));
  return router;
}
