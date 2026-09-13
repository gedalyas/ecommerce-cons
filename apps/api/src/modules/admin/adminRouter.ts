import { Router } from "express";
import { asyncHandler } from "@/shared/http/asyncHandler";
import { adminController, type AdminDependencies } from "./adminController";

export function createAdminRouter(deps: AdminDependencies): Router {
  const router = Router();
  const controller = adminController(deps);
  router.get("/admin", asyncHandler(controller.screen));
  router.post("/admin/invitations", asyncHandler(controller.invite));
  router.post("/admin/invitations/:id/resend", asyncHandler(controller.resend));
  router.delete("/admin/invitations/:id", asyncHandler(controller.revoke));
  router.put("/admin/stores/:id/consultants", asyncHandler(controller.assign));
  router.put("/admin/connection-requests/:id", asyncHandler(controller.resolve));
  return router;
}
