import { Router } from "express";
import { asyncHandler } from "@/shared/http/asyncHandler";
import { consultingController, type ConsultingDependencies } from "./consultingController";

export function createConsultingRouter(deps: ConsultingDependencies): Router {
  const router = Router();
  const controller = consultingController(deps);
  router.get("/consulting/milestone", asyncHandler(controller.milestone));
  router.get("/consulting/milestone/criteria", asyncHandler(controller.milestoneCriteria));
  router.put("/consulting/milestone/:key", asyncHandler(controller.updateMilestone));
  router.put("/consulting/pillars/:pillarKey", asyncHandler(controller.updatePillar));
  router.put("/consulting/pillars/:pillarKey/kpis/:kpiKey", asyncHandler(controller.setManualKpi));
  router.post("/consulting/recommendations", asyncHandler(controller.createRecommendation));
  router.put("/consulting/recommendations/:id", asyncHandler(controller.updateRecommendation));
  router.put(
    "/consulting/recommendations/:id/done",
    asyncHandler(controller.setRecommendationDone),
  );
  router.delete("/consulting/recommendations/:id", asyncHandler(controller.deleteRecommendation));
  return router;
}
