import { Router, type RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import { asyncHandler } from "@/shared/http/asyncHandler";
import { authController, type AuthDependencies } from "./authController";

const LOGIN_ATTEMPTS_PER_15_MIN = 20;

export function createAuthRouter(deps: AuthDependencies, requireAuth: RequestHandler): Router {
  const router = Router();
  const controller = authController(deps);
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: LOGIN_ATTEMPTS_PER_15_MIN,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Muitas tentativas. Aguarde alguns minutos." },
  });

  router.post("/auth/login", loginLimiter, asyncHandler(controller.login));
  router.post("/auth/register", loginLimiter, asyncHandler(controller.register));
  router.get("/auth/invitation", loginLimiter, asyncHandler(controller.invitation));
  router.post("/auth/refresh", asyncHandler(controller.refresh));
  router.post("/auth/logout", asyncHandler(controller.logout));
  router.get("/me", requireAuth, asyncHandler(controller.me));
  return router;
}
