import { Router, type Request } from "express";
import rateLimit from "express-rate-limit";
import { asyncHandler } from "@/shared/http/asyncHandler";
import { assistantController, type AssistantDependencies } from "./assistantController";

const QUESTIONS_PER_STORE_15_MIN = 60;
const QUESTIONS_PER_PERSON_15_MIN = 40;

export function createAssistantRouter(
  deps: AssistantDependencies & { rateLimited: boolean },
): Router {
  const router = Router();
  const controller = assistantController(deps);
  const limiter = (limit: number, keyOf: (req: Request) => string) =>
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit,
      standardHeaders: true,
      legacyHeaders: false,
      skip: () => !deps.rateLimited,
      keyGenerator: keyOf,
      message: { message: "Muitas perguntas seguidas. Aguarde alguns minutos." },
    });
  const perStore = limiter(QUESTIONS_PER_STORE_15_MIN, (req) => req.auth?.clientId ?? "anon");
  const perPerson = limiter(QUESTIONS_PER_PERSON_15_MIN, (req) => req.auth?.userId ?? "anon");
  router.post("/assistant/messages", perPerson, perStore, asyncHandler(controller.ask));
  return router;
}
