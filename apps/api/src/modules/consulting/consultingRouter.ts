import { Router } from "express";
import { asyncHandler } from "@/shared/http/asyncHandler";
import { consultingController } from "./consultingController";

export function createConsultingRouter(): Router {
  const router = Router();
  const controller = consultingController();
  router.get("/consulting/milestone", asyncHandler(controller.milestone));
  return router;
}
