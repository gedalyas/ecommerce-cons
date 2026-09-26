import { Router } from "express";
import rateLimit from "express-rate-limit";
import { asyncHandler } from "@/shared/http/asyncHandler";
import { reportsController } from "./reportsController";
import type { ReportDependencies } from "./reportsService";

const PREVIEWS_PER_15_MIN = 60;

export function createReportsRouter(deps: ReportDependencies & { rateLimited: boolean }): Router {
  const router = Router();
  const controller = reportsController(deps);
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: PREVIEWS_PER_15_MIN,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => !deps.rateLimited,
    keyGenerator: (req) => `${req.auth?.clientId ?? "anon"}:${req.auth?.userId ?? ""}`,
    message: { message: "Muitos relatórios seguidos. Aguarde alguns minutos." },
  });
  router.post("/reports/preview", limiter, asyncHandler(controller.preview));
  return router;
}
