import { Router, type RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import { asyncHandler } from "@/shared/http/asyncHandler";
import { authController, type AuthDependencies } from "./authController";

const LOGIN_ATTEMPTS_PER_15_MIN = 30;
const LOOKUPS_PER_15_MIN = 120;

export function createAuthRouter(deps: AuthDependencies, requireAuth: RequestHandler): Router {
  const router = Router();
  const controller = authController(deps);
  const limiter = (limit: number) =>
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit,
      standardHeaders: true,
      legacyHeaders: false,
      skip: () => !deps.rateLimited,
      message: { message: "Muitas tentativas. Aguarde alguns minutos." },
    });
  const loginLimiter = limiter(LOGIN_ATTEMPTS_PER_15_MIN);
  const lookupLimiter = limiter(LOOKUPS_PER_15_MIN);

  router.post("/auth/login", loginLimiter, asyncHandler(controller.login));
  router.post("/auth/register", loginLimiter, asyncHandler(controller.register));
  router.get("/auth/invitation", lookupLimiter, asyncHandler(controller.invitation));
  router.post("/auth/refresh", asyncHandler(controller.refresh));
  router.post("/auth/logout", asyncHandler(controller.logout));
  router.get("/me", requireAuth, asyncHandler(controller.me));
  return router;
}
