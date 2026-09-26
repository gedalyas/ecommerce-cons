import { Router } from "express";
import rateLimit from "express-rate-limit";
import { asyncHandler } from "@/shared/http/asyncHandler";
import { reportsController } from "./reportsController";
import type { ReportDependencies } from "./reportsService";

const PREVIEWS_PER_15_MIN = 60;
const PDFS_PER_15_MIN = 20;

export function createReportsRouter(deps: ReportDependencies & { rateLimited: boolean }): Router {
  const router = Router();
  const controller = reportsController(deps);
  const limiter = (limit: number) =>
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit,
      standardHeaders: true,
      legacyHeaders: false,
      skip: () => !deps.rateLimited,
      keyGenerator: (req) => `${req.auth?.clientId ?? "anon"}:${req.auth?.userId ?? ""}`,
      message: { message: "Muitos relatórios seguidos. Aguarde alguns minutos." },
    });
  router.post("/reports/preview", limiter(PREVIEWS_PER_15_MIN), asyncHandler(controller.preview));
  router.post("/reports/pdf", limiter(PDFS_PER_15_MIN), asyncHandler(controller.pdf));
  return router;
}
