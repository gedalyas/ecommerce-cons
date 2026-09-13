import cors from "cors";
import express, { type Express } from "express";
import { createAuthRouter, createRequireAuth } from "@/modules/auth/contract";
import { createHealthRouter } from "@/modules/health/contract";
import type { Env } from "@/shared/config/env";
import { errorHandler } from "@/shared/http/errorHandler";
import { notFound } from "@/shared/http/httpError";

export const API_PREFIX = "/api/v1";

export function createApp(env: Env, now: () => Date = () => new Date()): Express {
  const app = express();
  const requireAuth = createRequireAuth(env.JWT_SECRET);

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(cors({ origin: env.CORS_ORIGINS.length > 0 ? env.CORS_ORIGINS : false }));
  app.use(express.json({ limit: "1mb" }));

  app.use(API_PREFIX, createHealthRouter());
  app.use(API_PREFIX, createAuthRouter({ secret: env.JWT_SECRET, now }, requireAuth));

  app.use((_req, _res, next) => next(notFound("Rota não encontrada")));
  app.use(errorHandler);
  return app;
}
