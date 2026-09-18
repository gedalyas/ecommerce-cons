import { Router } from "express";
import { asyncHandler } from "@/shared/http/asyncHandler";
import { teamController, type TeamDependencies } from "./teamController";

export function createTeamRouter(deps: TeamDependencies): Router {
  const router = Router();
  const controller = teamController(deps);
  router.get("/team", asyncHandler(controller.screen));
  router.post("/team/invitations", asyncHandler(controller.invite));
  router.post("/team/invitations/:id/resend", asyncHandler(controller.resend));
  router.delete("/team/invitations/:id", asyncHandler(controller.revoke));
  router.put("/team/members/:id", asyncHandler(controller.update));
  router.delete("/team/members/:id", asyncHandler(controller.remove));
  return router;
}
