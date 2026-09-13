import cors from "cors";
import express, { type Express } from "express";
import { createAnalysisRouter } from "@/modules/analysis/contract";
import { createAdminRouter, visibleClientIds } from "@/modules/admin/contract";
import { createStaffActivityRouter, createStoreActivityRouter } from "@/modules/audit/contract";
import { createAuthRouter, createRequireAuth, resolveClient } from "@/modules/auth/contract";
import { createConnectionsRouter } from "@/modules/connections/contract";
import { createConsultingRouter } from "@/modules/consulting/contract";
import { createCustomersRouter, retentionSummary } from "@/modules/customers/contract";
import { createDashboardRouter } from "@/modules/dashboard/contract";
import { createGoalsRouter } from "@/modules/goals/contract";
import { createHealthRouter } from "@/modules/health/contract";
import { createImportsRouter } from "@/modules/imports/contract";
import { createInfluencersRouter } from "@/modules/influencers/contract";
import { createLogisticsRouter } from "@/modules/logistics/contract";
import { createManagementRouter } from "@/modules/management/contract";
import { createMarketingRouter } from "@/modules/marketing/contract";
import { createMoneyRouter, marketingCostLines } from "@/modules/money/contract";
import { createOrdersRouter } from "@/modules/orders/contract";
import { createProductsRouter } from "@/modules/products/contract";
import { createStoreOnboardingRouter, createStoreRouter } from "@/modules/store/contract";
import type { Env } from "@/shared/config/env";
import { errorHandler } from "@/shared/http/errorHandler";
import { createMailer } from "@/shared/mail/createMailer";
import { notFound } from "@/shared/http/httpError";

export const API_PREFIX = "/api/v1";

export function createApp(env: Env, now: () => Date = () => new Date()): Express {
  const app = express();
  const requireAuth = createRequireAuth(env.JWT_SECRET);
  const rateLimited = env.NODE_ENV !== "development";
  const mailer = createMailer(env, now);
  const appUrl = env.APP_URL;

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(cors({ origin: env.CORS_ORIGINS.length > 0 ? env.CORS_ORIGINS : false }));
  app.use(express.json({ limit: "1mb" }));

  app.use(API_PREFIX, createHealthRouter());
  app.use(
    API_PREFIX,
    createAuthRouter({ secret: env.JWT_SECRET, now, rateLimited, mailer, appUrl }, requireAuth),
  );

  app.use(
    API_PREFIX,
    requireAuth,
    createAdminRouter({ now, mailer, appUrl }),
    createStaffActivityRouter({ visibleStoresOf: visibleClientIds }),
    createStoreOnboardingRouter({ now }),
  );

  const storeRouters = [
    createStoreRouter({ now }),
    createDashboardRouter(),
    createOrdersRouter(),
    createProductsRouter(),
    createCustomersRouter(),
    createMoneyRouter(),
    createMarketingRouter({ costLinesFor: marketingCostLines, retentionFor: retentionSummary }),
    createLogisticsRouter(),
    createManagementRouter(),
    createGoalsRouter(),
    createAnalysisRouter(),
    createInfluencersRouter(),
    createConnectionsRouter(),
    createConsultingRouter({ now }),
    createImportsRouter({ now, rateLimited }),
    createStoreActivityRouter({ visibleStoresOf: visibleClientIds }),
  ];
  app.use(API_PREFIX, requireAuth, resolveClient, ...storeRouters);

  app.use((_req, _res, next) => next(notFound("Rota não encontrada")));
  app.use(errorHandler);
  return app;
}
