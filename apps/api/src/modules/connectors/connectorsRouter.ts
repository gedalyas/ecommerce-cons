import { Router } from "express";
import rateLimit from "express-rate-limit";
import { asyncHandler } from "@/shared/http/asyncHandler";
import { connectorsController } from "./connectorsController";
import type { ConnectorsDependencies } from "./connectorsService";

const SOURCE_SWITCHES_PER_15_MIN = 10;
const CONNECTION_TESTS_PER_15_MIN = 20;

export function createConnectorsRouter(
  deps: ConnectorsDependencies,
  { rateLimited }: { rateLimited: boolean },
): Router {
  const router = Router();
  const switches = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: SOURCE_SWITCHES_PER_15_MIN,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => !rateLimited,
    message: { message: "Muitas trocas de fonte. Aguarde alguns minutos." },
  });
  const tests = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: CONNECTION_TESTS_PER_15_MIN,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => !rateLimited,
    keyGenerator: (req) => `${req.auth?.clientId ?? "anon"}:${req.params["key"] ?? ""}`,
    message: { message: "Muitos testes seguidos. Aguarde alguns minutos." },
  });
  const controller = connectorsController(deps);
  router.post("/connectors/:key/authorize", asyncHandler(controller.authorize));
  router.post("/connectors/:key/credentials", asyncHandler(controller.credentials));
  router.post("/connectors/:key/sync", asyncHandler(controller.sync));
  router.post("/connectors/:key/test", tests, asyncHandler(controller.test));
  router.get("/connectors/:key/settings", asyncHandler(controller.settings));
  router.put("/connectors/:key/settings", asyncHandler(controller.saveSettings));
  router.put("/data-sources", switches, asyncHandler(controller.chooseSource));
  router.delete("/connectors/:key", asyncHandler(controller.remove));
  router.get("/data-readiness", asyncHandler(controller.readiness));
  return router;
}

export function createConnectorCallbackRouter(deps: ConnectorsDependencies): Router {
  const router = Router();
  router.get("/connectors/:key/callback", asyncHandler(connectorsController(deps).callback));
  return router;
}
